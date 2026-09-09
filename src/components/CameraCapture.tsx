import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, Volume2, VolumeX, Sparkles, SwitchCamera, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CapturedPhoto } from '../types';
import { playCountdownSound, playShutterSound, playCelebrationSound } from '../utils/sound';
import { POSE_RECOMMENDATIONS } from '../data/frames';

interface CameraCaptureProps {
  onPhotosComplete: (photos: CapturedPhoto[]) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onPhotosComplete,
  soundEnabled,
  onToggleSound,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMirror, setIsMirror] = useState(true);

  // Shooting states
  const [isShootingSession, setIsShootingSession] = useState(false);
  const [currentShotIndex, setCurrentShotIndex] = useState(0); // 0 to 4
  const [countdown, setCountdown] = useState<number | null>(null); // 3, 2, 1, or null
  const [isFlashing, setIsFlashing] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);

  // Devices list
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);

  // Keep video element synchronized whenever stream changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
      const playVideo = async () => {
        try {
          await video.play();
        } catch (err) {
          console.warn('Auto video play failed, waiting for user click:', err);
        }
      };
      playVideo();
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  // Initialize and list video devices
  const updateDeviceList = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(videoInputs);
      }
    } catch (e) {
      console.warn('enumerateDevices error:', e);
    }
  }, []);

  // Initialize camera with progressive fallbacks (LG Gram / Windows Camera / Webcam compatibility)
  const startCamera = useCallback(async (customDeviceId?: string) => {
    setIsLoadingCamera(true);
    setCameraError(null);

    // Stop existing stream tracks
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    const deviceToUse = customDeviceId !== undefined ? customDeviceId : selectedDeviceId;

    // Constraint tier list designed to work on laptop webcams (LG Gram, Samsung, ThinkPad, Mac, etc.)
    const constraintCandidates: MediaStreamConstraints[] = [];

    if (deviceToUse) {
      constraintCandidates.push({
        video: { deviceId: { exact: deviceToUse } },
        audio: false,
      });
    }

    // 1. Standard Laptop resolution without strict facingMode
    constraintCandidates.push({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    // 2. Facing mode user
    constraintCandidates.push({
      video: {
        facingMode: facingMode,
      },
      audio: false,
    });

    // 3. Simple basic true constraint
    constraintCandidates.push({
      video: true,
      audio: false,
    });

    let activeStream: MediaStream | null = null;
    let lastError: unknown = null;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('브라우저에서 카메라를 직접 열 수 없습니다. 아래 [새 창으로 열어 카메라 켜기] 버튼을 눌러주세요!');
      setIsLoadingCamera(false);
      return;
    }

    for (const constraints of constraintCandidates) {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (activeStream && activeStream.getVideoTracks().length > 0) {
          break;
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (activeStream) {
      setStream(activeStream);
      setCameraError(null);
      if (videoRef.current) {
        videoRef.current.srcObject = activeStream;
        videoRef.current.play().catch((playErr) => {
          console.warn('Video play() caught:', playErr);
        });
      }
      // Refresh available devices with labels
      updateDeviceList();
    } else {
      console.warn('Camera access error:', lastError);
      let errorMsg = '엘지 그램(노트북) 카메라에 연결할 수 없습니다.';
      if (lastError instanceof Error) {
        if (lastError.name === 'NotAllowedError' || lastError.name === 'PermissionDeniedError') {
          errorMsg = '카메라 접근이 차단되어 있습니다. 주소창의 🔒 자물쇠 아이콘을 눌러 카메라를 [허용]해주시거나, [새 창으로 열기]를 눌러주세요.';
        } else if (lastError.name === 'NotFoundError' || lastError.name === 'DevicesNotFoundError') {
          errorMsg = '노트북에 연결된 웹캠 장치를 찾을 수 없습니다. LG 스마트 어시스턴트(LG Smart Assistant) 또는 윈도우 카메라 보안 설정에서 웹캠이 꺼져있는지 확인해 주세요.';
        } else if (lastError.name === 'NotReadableError' || lastError.name === 'TrackStartError') {
          errorMsg = '카메라가 이미 다른 프로그램(LG Glance, Zoom, 카카오톡, 다른 브라우저 창 등)에서 사용 중입니다. 다른 앱을 닫고 다시 시도해 주세요.';
        } else {
          errorMsg = `${lastError.message} (카메라 연결을 다시 시도해주세요)`;
        }
      }
      setCameraError(errorMsg);
    }
    setIsLoadingCamera(false);
  }, [facingMode, selectedDeviceId, stream, updateDeviceList]);

  useEffect(() => {
    startCamera();
    updateDeviceList();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Capture current frame from video or fallback canvas
  const captureFrame = useCallback((): string => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return '';

    const width = video?.videoWidth || 800;
    const height = video?.videoHeight || 600;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // If video is active and playing
    if (video && video.readyState >= 2) {
      ctx.save();
      if (isMirror && facingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, width, height);
      ctx.restore();
    } else {
      // Fallback cute cartoon frame generator for demonstration
      ctx.fillStyle = '#FEF9C3';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#854D0E';
      ctx.font = 'bold 36px "OwnglyphYuntaeng", "Jua", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`귀여운 우리반 사진 #${currentShotIndex + 1}`, width / 2, height / 2 - 30);
      ctx.font = '28px "OwnglyphYuntaeng", "Jua", sans-serif';
      ctx.fillText('찰칵! 즐거운 유치원 생활 🌟', width / 2, height / 2 + 30);
    }

    return canvas.toDataURL('image/jpeg', 0.92);
  }, [isMirror, facingMode, currentShotIndex]);

  // Handle taking a single photo with 3, 2, 1 countdown
  const runCountdownAndCapture = useCallback(
    (targetIndex: number, onDone: (photoUrl: string) => void) => {
      let count = 3;
      setCountdown(3);
      if (soundEnabled) playCountdownSound(3);

      const interval = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setCountdown(count);
          if (soundEnabled) playCountdownSound(count);
        } else {
          clearInterval(interval);
          setCountdown(null);
          // Shutter moment
          setIsFlashing(true);
          if (soundEnabled) playShutterSound();
          setTimeout(() => setIsFlashing(false), 300);

          const photoUrl = captureFrame();
          onDone(photoUrl);
        }
      }, 1000);
    },
    [captureFrame, soundEnabled]
  );

  // Start 5-photo automated sequence
  const startFiveShotsSequence = useCallback(() => {
    setIsShootingSession(true);
    setCapturedPhotos([]);
    setCurrentShotIndex(0);

    const allPhotos: CapturedPhoto[] = [];

    const takeNext = (index: number) => {
      if (index >= 5) {
        setIsShootingSession(false);
        if (soundEnabled) playCelebrationSound();
        return;
      }

      setCurrentShotIndex(index);

      // Brief preparation pause
      setTimeout(() => {
        runCountdownAndCapture(index, (photoUrl) => {
          const newPhoto: CapturedPhoto = {
            id: `shot-${Date.now()}-${index}`,
            dataUrl: photoUrl,
            index: index,
            timestamp: Date.now(),
          };
          allPhotos.push(newPhoto);
          setCapturedPhotos([...allPhotos]);

          if (index + 1 < 5) {
            // Next shot in 1.8 seconds so kids can prepare their next pose!
            setTimeout(() => {
              takeNext(index + 1);
            }, 1800);
          } else {
            setIsShootingSession(false);
            if (soundEnabled) playCelebrationSound();
          }
        });
      }, 800);
    };

    takeNext(0);
  }, [runCountdownAndCapture, soundEnabled]);

  // Retake a specific photo
  const handleRetakeSingle = (indexToRetake: number) => {
    setRetakeIndex(indexToRetake);
    setCurrentShotIndex(indexToRetake);
    runCountdownAndCapture(indexToRetake, (photoUrl) => {
      setCapturedPhotos((prev) => {
        const next = [...prev];
        next[indexToRetake] = {
          id: `shot-${Date.now()}-${indexToRetake}`,
          dataUrl: photoUrl,
          index: indexToRetake,
          timestamp: Date.now(),
        };
        return next;
      });
      setRetakeIndex(null);
      if (soundEnabled) playCelebrationSound();
    });
  };

  // Sample cute mock photos loader for testing without physical camera
  const handleLoadSamplePhotos = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sampleThemes = [
      { bg: '#FDE047', text: '1. 꽃받침 포즈 🌸', emoji: '🥰' },
      { bg: '#BAE6FD', text: '2. 하트 뿅뿅 💕', emoji: '🫶' },
      { bg: '#FED7AA', text: '3. 멋진 브이 ✌️', emoji: '✌️' },
      { bg: '#FBCFE8', text: '4. 귀여운 볼콕 🐱', emoji: '😸' },
      { bg: '#D9F99D', text: '5. 우리반 최고! 👍', emoji: '🥳' },
    ];

    const samples: CapturedPhoto[] = sampleThemes.map((item, idx) => {
      ctx.fillStyle = item.bg;
      ctx.fillRect(0, 0, 640, 480);

      // Cute playful background shapes
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(320, 240, 180, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 38px "OwnglyphYuntaeng", "Jua", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.text, 320, 160);

      ctx.font = '100px sans-serif';
      ctx.fillText(item.emoji, 320, 280);

      ctx.font = '26px "OwnglyphYuntaeng", "Jua", sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('햇살가득 우리반 5컷 사진', 320, 360);

      return {
        id: `sample-${idx}`,
        dataUrl: canvas.toDataURL('image/jpeg', 0.9),
        index: idx,
        timestamp: Date.now(),
      };
    });

    setCapturedPhotos(samples);
  };

  // File upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const loaded: CapturedPhoto[] = [];
    const fileList: File[] = Array.from(files);
    fileList.slice(0, 5).forEach((file: File, idx: number) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          loaded.push({
            id: `upload-${Date.now()}-${idx}`,
            dataUrl: event.target.result as string,
            index: idx,
            timestamp: Date.now(),
          });
          if (loaded.length === Math.min(files.length, 5)) {
            // Fill up to 5 if fewer uploaded
            setCapturedPhotos((prev) => {
              const combined = [...loaded];
              return combined.slice(0, 5);
            });
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const currentPose = POSE_RECOMMENDATIONS[currentShotIndex] || POSE_RECOMMENDATIONS[0];

  return (
    <div id="camera-capture-root" className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {/* Top instruction & Sound controls */}
      <div className="bg-amber-100/80 border-2 border-amber-300 rounded-3xl p-4 md:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-amber-900">
          <div className="w-12 h-12 rounded-2xl bg-amber-300 flex items-center justify-center text-2xl shadow-inner shrink-0">
            📸
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-jua">
              3, 2, 1 찰칵! 총 5장의 사진을 찍어요
            </h2>
            <p className="text-sm md:text-base text-amber-800/90">
              카운트다운에 맞춰 멋진 포즈를 지어보세요. 촬영 후 마음에 드는 4장을 고를 수 있어요!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-sound"
            onClick={onToggleSound}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/90 hover:bg-white text-amber-900 rounded-2xl border border-amber-200 font-jua text-sm shadow-sm transition active:scale-95"
            title="효과음 켜기/끄기"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span>{soundEnabled ? '소리 켜짐' : '소리 꺼짐'}</span>
          </button>
        </div>
      </div>

      {/* Main Viewfinder Section */}
      <div className="relative bg-slate-900 rounded-3xl overflow-hidden shadow-xl border-4 border-amber-300 aspect-[4/3] max-h-[540px] flex items-center justify-center">
        {/* Hidden Canvas for capturing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Video stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${
            isMirror && facingMode === 'user' ? '-scale-x-100' : ''
          }`}
        />

        {/* Shutter White Flash overlay */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white pointer-events-none z-40 animate-camera-flash" />
        )}

        {/* Giant Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center z-30 pointer-events-none">
            <div
              key={countdown}
              className="text-8xl md:text-9xl font-black text-amber-300 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] animate-pop-bounce"
            >
              {countdown}
            </div>
            <div className="mt-4 px-6 py-2 bg-amber-400 text-slate-900 rounded-full font-jua text-xl md:text-2xl shadow-lg animate-pulse">
              {currentPose.title}
            </div>
          </div>
        )}

        {/* Active Shooting Progress Banner */}
        {isShootingSession && countdown === null && (
          <div className="absolute top-4 inset-x-4 flex justify-center z-20 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-md text-white px-6 py-3 rounded-2xl border border-amber-300/50 flex items-center gap-3 shadow-lg">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span className="font-jua text-lg md:text-xl text-amber-300">
                {currentShotIndex + 1}번째 사진 준비 중... ({currentShotIndex + 1} / 5)
              </span>
              <span className="text-sm bg-amber-400 text-slate-900 px-3 py-1 rounded-full font-bold">
                {currentPose.emoji} {currentPose.title}
              </span>
            </div>
          </div>
        )}

        {/* Viewfinder Cute Frame Decoration */}
        <div className="absolute inset-0 pointer-events-none border-[12px] border-amber-300/30 rounded-3xl m-3 flex flex-col justify-between p-4">
          <div className="flex justify-between items-center">
            <span className="bg-amber-400 text-amber-950 font-jua px-3 py-1 rounded-full text-xs md:text-sm shadow">
              💛 우리반 네컷 스튜디오
            </span>
            <span className="text-2xl">🐥 ✨</span>
          </div>
          <div className="flex justify-between items-center text-xs text-white/80 font-jua">
            <span>스마일~ 치즈! 🧀</span>
            <span>5장 중 4장 선택</span>
          </div>
        </div>

        {/* Camera Warning / Fallback Notice */}
        {cameraError && !stream && (
          <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-white z-20 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-3xl mb-3 shadow-inner">
              📷
            </div>
            <h3 className="text-xl md:text-2xl font-bold font-jua text-amber-300 mb-2">
              컴퓨터 카메라 연결하기
            </h3>
            <p className="text-sm md:text-base text-slate-200 max-w-lg mb-4 leading-relaxed font-sans">
              {cameraError}
            </p>

            <div className="bg-amber-950/60 border border-amber-400/30 rounded-2xl p-4 max-w-lg mb-5 text-left text-xs md:text-sm text-amber-200/90 space-y-2">
              <p className="font-bold text-amber-300 text-sm">💡 LG 그램(노트북) 카메라 실행 팁:</p>
              <p>1. <strong>LG 보안 잠금 확인</strong>: LG 그램 키보드에서 <strong>Fn + F7</strong> 또는 <strong>LG Smart Assistant</strong> 앱에서 <strong>'카메라 잠금/보안'</strong>이 켜져있다면 꺼주세요.</p>
              <p>2. <strong>브라우저 권한 허용</strong>: 주소창 맨 왼쪽의 <strong>자물쇠 🔒 아이콘</strong> 클릭 후 카메라를 <strong>[허용]</strong>으로 설정하세요.</p>
              <p>3. <strong>새 창에서 열기</strong>: 아래 <strong>[🚀 새 창으로 열어 카메라 켜기]</strong>를 누르시면 전체 화면에서 바로 카메라 권한 요청창이 뜹니다.</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => startCamera()}
                disabled={isLoadingCamera}
                className="px-5 py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-900 rounded-2xl font-jua text-sm md:text-base flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer font-bold"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingCamera ? 'animate-spin' : ''}`} />
                <span>{isLoadingCamera ? '카메라 연결 중...' : '카메라 다시 연결'}</span>
              </button>

              <button
                onClick={() => window.open(window.location.href, '_blank')}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-jua text-sm md:text-base flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                title="새 탭/새 창에서 전체 화면으로 실행하여 카메라 권한 승인"
              >
                <span>🚀 새 창으로 열어 카메라 켜기</span>
              </button>

              <button
                onClick={handleLoadSamplePhotos}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-jua text-sm flex items-center gap-2 shadow-md transition active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" /> 샘플 사진으로 체험
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-jua text-sm flex items-center gap-2 shadow-md transition active:scale-95"
              >
                <Upload className="w-4 h-4 text-emerald-400" /> 사진 파일 업로드
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        )}
      </div>

      {/* Control Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Camera toggles & device selector */}
        <div className="flex flex-wrap items-center gap-2">
          {videoDevices.length > 1 && (
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                startCamera(e.target.value);
              }}
              className="px-3 py-2.5 bg-white border-2 border-amber-200 text-slate-700 rounded-2xl font-jua text-xs md:text-sm shadow-sm focus:outline-none focus:border-amber-400"
            >
              <option value="">카메라 장치 선택 ({videoDevices.length}개 발견)</option>
              {videoDevices.map((device, idx) => (
                <option key={device.deviceId || idx} value={device.deviceId}>
                  {device.label || `카메라 ${idx + 1}`}
                </option>
              ))}
            </select>
          )}

          <button
            id="btn-reconnect-camera"
            onClick={() => startCamera()}
            disabled={isLoadingCamera}
            className="px-3.5 py-2.5 bg-white hover:bg-amber-50 border-2 border-amber-200 text-slate-700 rounded-2xl font-jua text-xs md:text-sm flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
            title="카메라 새로고침"
          >
            <RefreshCw className={`w-4 h-4 text-amber-600 ${isLoadingCamera ? 'animate-spin' : ''}`} />
            <span>카메라 켜기/새로고침</span>
          </button>

          <button
            id="btn-flip-camera"
            onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border-2 border-amber-200 text-slate-700 rounded-2xl font-jua text-xs md:text-sm flex items-center gap-2 shadow-sm transition active:scale-95"
          >
            <SwitchCamera className="w-4 h-4 text-amber-500" />
            <span>전/후면 전환</span>
          </button>

          <button
            id="btn-toggle-mirror"
            onClick={() => setIsMirror((prev) => !prev)}
            className={`px-3.5 py-2.5 border-2 rounded-2xl font-jua text-xs md:text-sm flex items-center gap-2 shadow-sm transition active:scale-95 ${
              isMirror
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <span>거울모드 {isMirror ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Big Capture Trigger Button */}
        <div className="flex items-center gap-3">
          <button
            id="btn-start-five-shots"
            disabled={isShootingSession}
            onClick={startFiveShotsSequence}
            className="px-8 py-4 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-900 rounded-3xl font-jua text-lg md:text-xl font-bold shadow-lg hover:shadow-amber-300/40 flex items-center gap-3 transition transform active:scale-95 cursor-pointer border-4 border-amber-200"
          >
            <Camera className="w-6 h-6 text-slate-900" />
            <span>
              {isShootingSession
                ? `촬영 중... (${currentShotIndex + 1}/5)`
                : capturedPhotos.length > 0
                ? '🔄 5장 다시 찍기'
                : '📸 5컷 연속 촬영 시작!'}
            </span>
          </button>
        </div>
      </div>

      {/* Captured 5 Photos Tray */}
      <div className="bg-white border-2 border-amber-200 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎞️</span>
            <h3 className="font-jua text-lg md:text-xl text-slate-800">
              촬영된 사진 보관함 ({capturedPhotos.length} / 5장)
            </h3>
          </div>
          {capturedPhotos.length === 5 && (
            <button
              id="btn-proceed-to-select"
              onClick={() => onPhotosComplete(capturedPhotos)}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-jua text-base shadow-md flex items-center gap-2 transition active:scale-95 cursor-pointer animate-bounce"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>4장 사진 고르러 가기 ✨</span>
            </button>
          )}
        </div>

        {/* 5 Photo Slots Grid */}
        <div className="grid grid-cols-5 gap-2 md:gap-4">
          {[0, 1, 2, 3, 4].map((slotIdx) => {
            const photo = capturedPhotos[slotIdx];
            const isCurrentlyRetaking = retakeIndex === slotIdx;
            const pose = POSE_RECOMMENDATIONS[slotIdx];

            return (
              <div
                key={slotIdx}
                className={`relative aspect-[3/4] rounded-2xl border-2 overflow-hidden flex flex-col items-center justify-center transition-all ${
                  photo
                    ? 'border-amber-400 bg-amber-50 shadow-sm'
                    : 'border-dashed border-amber-200 bg-amber-50/50'
                }`}
              >
                {photo ? (
                  <>
                    <img
                      src={photo.dataUrl}
                      alt={`촬영컷 ${slotIdx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1.5 left-1.5 bg-amber-400 text-slate-900 font-jua text-xs px-2 py-0.5 rounded-full shadow">
                      #{slotIdx + 1}
                    </span>
                    {!isShootingSession && (
                      <button
                        onClick={() => handleRetakeSingle(slotIdx)}
                        disabled={isCurrentlyRetaking}
                        title="이 사진만 다시 찍기"
                        className="absolute bottom-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full text-xs transition active:scale-90"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isCurrentlyRetaking ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-2 text-center text-amber-700/60">
                    <span className="text-xl md:text-2xl mb-1">{pose.emoji}</span>
                    <span className="font-jua text-xs md:text-sm font-bold">#{slotIdx + 1}컷</span>
                    <span className="text-[10px] hidden md:block text-amber-800/80 font-gaegu line-clamp-1">
                      {pose.title.split(' ')[0]}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {capturedPhotos.length > 0 && capturedPhotos.length < 5 && (
          <div className="text-center text-sm font-jua text-amber-800 bg-amber-50 py-2 rounded-xl">
            5장 촬영이 진행 중입니다. 잠시만 기다려주세요! ({capturedPhotos.length}/5)
          </div>
        )}
      </div>
    </div>
  );
};
