"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  completeInterview,
  getInterview,
  submitAnswer,
  Interview,
} from "@/lib/interview";
import { useLLMSessionStore } from "@/lib/store";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  KeyRound,
  Clock3,
  Video,
  Mic,
  StopCircle,
} from "lucide-react";

type TranscriptSource = "manual" | "speech_recognition" | "unknown";

type VideoMeta = {
  durationSec: number;
  transcriptSource: TranscriptSource;
  previewUrl?: string;
};

export default function InterviewPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const { toast } = useToast();
  const interviewId = Array.isArray(routeParams.id)
    ? routeParams.id[0]
    : routeParams.id;

  const llmCredentials = useLLMSessionStore((state) => state.credentials);
  const hasLLMCredentials = useLLMSessionStore((state) =>
    state.hasCredentials(),
  );

  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [timeRemainingSec, setTimeRemainingSec] = useState<number | null>(null);
  const hasAutoCompletedRef = useRef(false);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoMetaByQuestion, setVideoMetaByQuestion] = useState<
    Record<string, VideoMeta>
  >({});

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartedAtRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const loadInterview = async () => {
      if (!interviewId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const response = await getInterview(interviewId);

      if (!response.success) {
        toast({
          title: "Error",
          description: "Failed to load interview",
          variant: "destructive",
        });
        if (typeof window !== "undefined") {
          window.location.replace("/dashboard");
        }
        return;
      }

      setInterview(response.data || null);

      if (response.data?.userAnswers) {
        const answersMap: Record<string, string> = {};
        const feedbackMap: Record<string, string> = {};
        const videoMap: Record<string, VideoMeta> = {};

        response.data.userAnswers.forEach((ua) => {
          answersMap[ua.questionId] = ua.answer;
          feedbackMap[ua.questionId] = ua.feedback;

          if (ua.answerType === "video") {
            videoMap[ua.questionId] = {
              durationSec: Number(ua.videoDurationSec || 0),
              transcriptSource: ua.transcriptSource || "unknown",
            };
          }
        });

        setAnswers(answersMap);
        setFeedback(feedbackMap);
        setVideoMetaByQuestion(videoMap);
      }

      setIsLoading(false);
    };

    loadInterview();
  }, [interviewId, toast]);

  useEffect(() => {
    if (
      !interview ||
      interview.mode !== "test" ||
      !interview.testConfig?.endsAt
    ) {
      setTimeRemainingSec(null);
      return;
    }

    const tick = () => {
      const endTime = new Date(interview.testConfig?.endsAt || "").getTime();
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeRemainingSec(remaining);
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [interview]);

  useEffect(() => {
    const autoCompleteIfExpired = async () => {
      if (!interview || interview.mode !== "test") return;
      if (timeRemainingSec === null || timeRemainingSec > 0) return;
      if (interview.status === "completed" || hasAutoCompletedRef.current)
        return;

      hasAutoCompletedRef.current = true;
      const response = await completeInterview(interview._id);
      if (response.success) {
        setInterview((prev) =>
          prev
            ? {
                ...prev,
                status: "completed",
                completedAt: new Date().toISOString(),
              }
            : prev,
        );
        toast({
          title: "Test completed",
          description: "Time is up. Interview auto-submitted.",
        });
      }
    };

    autoCompleteIfExpired();
  }, [timeRemainingSec, interview, toast]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      Object.values(videoMetaByQuestion).forEach((meta) => {
        if (meta.previewUrl) {
          URL.revokeObjectURL(meta.previewUrl);
        }
      });
    };
  }, [videoMetaByQuestion]);

  const isVideoMode = interview?.mode === "video";
  const speechRecognitionSupported =
    typeof window !== "undefined" &&
    (Boolean((window as any).SpeechRecognition) ||
      Boolean((window as any).webkitSpeechRecognition));

  const startSpeechToText = (questionId: string) => {
    if (!speechRecognitionSupported) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let textChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) {
          textChunk += `${event.results[i][0].transcript} `;
        }
      }

      if (textChunk.trim()) {
        setAnswers((prev) => ({
          ...prev,
          [questionId]: `${prev[questionId] || ""}${textChunk}`.trim(),
        }));

        setVideoMetaByQuestion((prev) => ({
          ...prev,
          [questionId]: {
            durationSec: prev[questionId]?.durationSec || 0,
            transcriptSource: "speech_recognition",
            previewUrl: prev[questionId]?.previewUrl,
          },
        }));
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopSpeechToText = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const ensureCamera = async () => {
    try {
      if (streamRef.current) {
        setCameraReady(true);
        return true;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraReady(true);
      setCameraError(null);
      return true;
    } catch (error) {
      setCameraError(
        error instanceof Error
          ? error.message
          : "Unable to access webcam/microphone",
      );
      return false;
    }
  };

  const startVideoRecording = async (questionId: string) => {
    const ready = await ensureCamera();
    if (!ready || !streamRef.current) return;

    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: "video/webm",
    });
    recorderRef.current = recorder;
    recordStartedAtRef.current = Date.now();

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const elapsed = recordStartedAtRef.current
        ? Math.max(
            1,
            Math.round((Date.now() - recordStartedAtRef.current) / 1000),
          )
        : 0;

      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const previewUrl = URL.createObjectURL(blob);

      setVideoMetaByQuestion((prev) => {
        if (prev[questionId]?.previewUrl) {
          URL.revokeObjectURL(prev[questionId].previewUrl as string);
        }

        return {
          ...prev,
          [questionId]: {
            durationSec: elapsed,
            transcriptSource: prev[questionId]?.transcriptSource || "manual",
            previewUrl,
          },
        };
      });
    };

    recorder.start();
    setIsRecordingVideo(true);
    if (speechRecognitionSupported) {
      startSpeechToText(questionId);
    }
  };

  const stopVideoRecording = () => {
    if (!recorderRef.current) return;
    recorderRef.current.stop();
    stopSpeechToText();
    setIsRecordingVideo(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-2">Interview Not Found</h2>
            <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = interview.questions[currentQuestionIdx];
  const answeredCount = Object.keys(feedback).length;
  const progressPercent = (answeredCount / interview.questions.length) * 100;
  const isAnswered = currentQuestion.id in feedback;
  const currentAnswer = answers[currentQuestion.id] || "";
  const currentFeedback = feedback[currentQuestion.id];
  const currentVideoMeta = videoMetaByQuestion[currentQuestion.id];

  const canSubmit =
    !isSubmitting &&
    !!currentAnswer.trim() &&
    hasLLMCredentials &&
    (interview.mode !== "test" ||
      (timeRemainingSec !== null && timeRemainingSec > 0));

  const timerLabel =
    timeRemainingSec === null
      ? null
      : `${Math.floor(timeRemainingSec / 60)}:${String(timeRemainingSec % 60).padStart(2, "0")}`;

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) {
      toast({
        title: "Empty answer",
        description: "Please provide an answer before submitting",
        variant: "destructive",
      });
      return;
    }

    if (!hasLLMCredentials) {
      toast({
        title: "Missing API key",
        description: "Go to research page and save your LLM credentials first",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await submitAnswer(
        interview._id,
        currentQuestion.id,
        currentAnswer,
        llmCredentials.apiKey,
        llmCredentials.provider,
        llmCredentials.model,
        llmCredentials.provider === "custom"
          ? llmCredentials.baseUrl
          : undefined,
        {
          answerType: isVideoMode ? "video" : "text",
          videoDurationSec: isVideoMode
            ? currentVideoMeta?.durationSec
            : undefined,
          transcriptSource: isVideoMode
            ? currentVideoMeta?.transcriptSource || "manual"
            : "manual",
        },
      );

      if (!response.success) {
        toast({
          title: "Error",
          description: response.message || "Failed to submit answer",
          variant: "destructive",
        });
        return;
      }

      setFeedback((prev) => ({
        ...prev,
        [currentQuestion.id]: response.data?.feedback || "",
      }));

      toast({
        title: "Answer submitted",
        description: "Feedback generated",
      });
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteInterview = async () => {
    setIsSubmitting(true);

    try {
      const response = await completeInterview(interview._id);

      if (!response.success) {
        toast({
          title: "Error",
          description: "Failed to complete interview",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Interview completed",
        description: "Great job!",
      });

      router.push("/dashboard");
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < interview.questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <KeyRound className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Feedback provider: {llmCredentials.provider}/{llmCredentials.model}
          </AlertDescription>
        </Alert>

        {!hasLLMCredentials && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertDescription className="text-amber-800">
              No saved local API key found. Return to the research page and save
              credentials first.
            </AlertDescription>
          </Alert>
        )}

        {interview.mode === "test" && timerLabel && (
          <Alert
            className={`mb-6 ${timeRemainingSec !== null && timeRemainingSec <= 60 ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"}`}
          >
            <Clock3
              className={`h-4 w-4 ${timeRemainingSec !== null && timeRemainingSec <= 60 ? "text-red-600" : "text-slate-700"}`}
            />
            <AlertDescription
              className={`${timeRemainingSec !== null && timeRemainingSec <= 60 ? "text-red-800" : "text-slate-800"} font-semibold`}
            >
              Timed test running. Time remaining: {timerLabel}
            </AlertDescription>
          </Alert>
        )}

        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">
                {interview.company} Interview
              </h1>
              <p className="text-muted-foreground">
                {interview.questions.length} questions - Difficulty:{" "}
                <span className="capitalize font-semibold">
                  {interview.difficulty}
                </span>
              </p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge
                variant={
                  interview.mode === "video"
                    ? "default"
                    : interview.mode === "test"
                      ? "secondary"
                      : "outline"
                }
              >
                {interview.mode === "video"
                  ? "Video Mode"
                  : interview.mode === "test"
                    ? "Test Mode"
                    : "Practice Mode"}
              </Badge>
              <Badge
                variant={
                  interview.status === "completed" ? "default" : "outline"
                }
              >
                {interview.status === "completed" ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completed
                  </>
                ) : (
                  "In Progress"
                )}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-semibold">
                {answeredCount} / {interview.questions.length}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </Card>

        <Card className="p-8 mb-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                Question {currentQuestionIdx + 1} of{" "}
                {interview.questions.length}
              </h2>
              <Badge variant="outline">{currentQuestion.difficulty}</Badge>
            </div>
            <p className="text-lg text-muted-foreground mb-4">
              {currentQuestion.question}
            </p>
            {currentQuestion.topic && (
              <Badge variant="secondary">{currentQuestion.topic}</Badge>
            )}
          </div>

          {currentQuestion.hints &&
            currentQuestion.hints.length > 0 &&
            interview.mode !== "test" && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                <p className="font-semibold text-sm mb-2">Hints:</p>
                <ul className="space-y-1">
                  {currentQuestion.hints.map((hint, idx) => (
                    <li key={idx} className="text-sm text-blue-900">
                      - {hint}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {isVideoMode && (
            <div className="mb-6 p-4 rounded-lg border bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Video Interview Console</p>
                {isRecordingVideo && (
                  <Badge variant="destructive" className="gap-1">
                    <StopCircle className="w-3.5 h-3.5" />
                    Recording
                  </Badge>
                )}
              </div>

              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full rounded-md border bg-black/80 max-h-64"
              />

              {cameraError && (
                <p className="text-xs text-red-600">{cameraError}</p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={ensureCamera}>
                  <Video className="w-4 h-4 mr-2" />
                  {cameraReady ? "Camera ready" : "Enable camera"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startVideoRecording(currentQuestion.id)}
                  disabled={isRecordingVideo || !cameraReady}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Start recording
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopVideoRecording}
                  disabled={!isRecordingVideo}
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Stop recording
                </Button>
              </div>

              {currentVideoMeta?.previewUrl && (
                <video
                  src={currentVideoMeta.previewUrl}
                  controls
                  className="w-full rounded-md border max-h-48"
                />
              )}
              {currentVideoMeta && (
                <p className="text-xs text-muted-foreground">
                  Captured video duration: {currentVideoMeta.durationSec}s |
                  Transcript source: {currentVideoMeta.transcriptSource}
                </p>
              )}
              {!speechRecognitionSupported && (
                <p className="text-xs text-muted-foreground">
                  Speech recognition is not available in this browser. Type your
                  spoken answer manually below.
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="answer"
                className="block text-sm font-medium mb-2"
              >
                {isVideoMode ? "Transcript / Answer" : "Your Answer"}
              </label>
              <Textarea
                id="answer"
                placeholder={
                  isVideoMode
                    ? "Record and/or type your response transcript here..."
                    : "Type your answer here..."
                }
                value={currentAnswer}
                onChange={(e) => {
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: e.target.value,
                  }));

                  if (isVideoMode) {
                    setVideoMetaByQuestion((prev) => ({
                      ...prev,
                      [currentQuestion.id]: {
                        durationSec: prev[currentQuestion.id]?.durationSec || 0,
                        transcriptSource: "manual",
                        previewUrl: prev[currentQuestion.id]?.previewUrl,
                      },
                    }));
                  }
                }}
                disabled={
                  isSubmitting ||
                  isAnswered ||
                  (interview.mode === "test" && (timeRemainingSec || 0) <= 0)
                }
                rows={6}
              />
            </div>

            {!isAnswered && (
              <Button
                onClick={handleSubmitAnswer}
                disabled={!canSubmit}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Answer"
                )}
              </Button>
            )}

            {currentFeedback && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-semibold text-sm mb-2 text-green-900">
                  Feedback:
                </p>
                <p className="text-sm text-green-800">{currentFeedback}</p>
              </div>
            )}
          </div>
        </Card>

        <div className="flex gap-4 justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIdx === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {answeredCount === interview.questions.length && (
              <Button
                onClick={handleCompleteInterview}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Interview
                  </>
                )}
              </Button>
            )}
            {currentQuestionIdx === interview.questions.length - 1 ? (
              <Button disabled variant="outline">
                Last Question
              </Button>
            ) : (
              <Button onClick={handleNextQuestion}>Next</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
