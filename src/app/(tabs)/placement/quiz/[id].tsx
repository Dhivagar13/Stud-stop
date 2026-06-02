import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing, FadeInUp } from 'react-native-reanimated';
import { useThemeStore } from '../../../../stores/themeStore';
import { supabase } from '../../../../lib/supabase';
import { useAuthStore } from '../../../../stores/authStore';
import { QuizModal } from '../../../../components/modals/QuizModal';
import { typography } from '../../../../lib/theme';
import type { PlacementQuiz, QuizQuestion } from '../../../../types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const { width } = Dimensions.get('window');
const timerRadius = 30;
const timerCircumference = 2 * Math.PI * timerRadius;

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);

  const [quiz, setQuiz] = useState<PlacementQuiz | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizEnded, setQuizEnded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const timerProgress = useSharedValue(timerCircumference);
  const timerAnimProps = useAnimatedProps(() => ({ strokeDashoffset: timerProgress.value }));

  useEffect(() => {
    loadQuiz();
  }, []);

  async function loadQuiz() {
    const { data } = await supabase.from('placement_quizzes').select('*').eq('id', id).single();
    if (data) {
      setQuiz(data as PlacementQuiz);
      setTimeLeft(data.time_limit_minutes * 60);
    }
  }

  useEffect(() => {
    if (!quiz || quizEnded) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(interval); endQuiz(); return 0; }
        const progress = (prev / (quiz.time_limit_minutes * 60)) * timerCircumference;
        timerProgress.value = withTiming(progress, { duration: 1000 });
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [quiz, quizEnded]);

  function handleSelect(index: number) {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    const correct = index === quiz?.questions[currentQ].correct_answer;
    setIsCorrect(correct);
    if (correct) setScore((s) => s + 1);
  }

  function handleNext() {
    if (quiz && currentQ < quiz.questions.length - 1) {
      setCurrentQ((q) => q + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      endQuiz();
    }
  }

  async function endQuiz() {
    setQuizEnded(true);
    setShowModal(false);
    const timeTaken = (quiz?.time_limit_minutes || 0) * 60 - timeLeft;
    await supabase.from('quiz_attempts').insert({
      student_id: session?.user.id,
      quiz_id: quiz?.id,
      answers: [],
      score,
      time_taken_seconds: timeTaken,
    });
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (quizEnded) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
        <BlurView intensity={60} tint="dark" style={styles.resultCard}>
          <Animated.View entering={FadeInUp.springify()}>
            <Text style={[typography.h1, { color: theme.text, textAlign: 'center' }]}>Quiz Complete!</Text>
            <View style={styles.scoreCircle}>
              <Text style={[typography.hero, { color: theme.accent }]}>{score}/{quiz?.questions.length}</Text>
            </View>
            <Text style={[typography.body, { color: theme.textMuted, textAlign: 'center' }]}>
              Time: {Math.floor((quiz!.time_limit_minutes * 60 - timeLeft) / 60)}m {(quiz!.time_limit_minutes * 60 - timeLeft) % 60}s
            </Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: theme.accent }]} onPress={() => router.back()}>
              <Text style={styles.btnText}>Back to Placement</Text>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[typography.body, { color: theme.accent }]}>Exit</Text>
        </TouchableOpacity>
        <View style={styles.timerContainer}>
          <Svg width={70} height={70} viewBox="0 0 70 70">
            <Circle cx="35" cy="35" r={timerRadius} stroke={theme.glassBorder} strokeWidth="4" fill="none" />
            <AnimatedCircle
              cx="35" cy="35" r={timerRadius}
              stroke={timeLeft < 10 ? theme.danger : theme.accent}
              strokeWidth="4" fill="none"
              strokeDasharray={timerCircumference}
              animatedProps={timerAnimProps}
              strokeLinecap="round"
              transform="rotate(-90 35 35)"
            />
          </Svg>
          <Text style={[styles.timerText, { color: timeLeft < 10 ? theme.danger : theme.text }]}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </Text>
        </View>
        <Text style={[typography.body, { color: theme.textMuted }]}>
          {currentQ + 1}/{quiz?.questions.length}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.questionArea}
        onPress={() => setShowModal(true)}
      >
        <BlurView intensity={40} tint="dark" style={styles.questionCard}>
          <Text style={[typography.h2, { color: theme.text, textAlign: 'center' }]}>
            {quiz?.questions[currentQ].question}
          </Text>
          <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'center', marginTop: 16 }]}>
            Tap to answer
          </Text>
        </BlurView>
      </TouchableOpacity>

      {quiz && (
        <QuizModal
          visible={showModal}
          question={quiz.questions[currentQ]}
          selectedAnswer={selectedAnswer}
          isCorrect={isCorrect}
          onSelect={handleSelect}
          onNext={handleNext}
          questionNumber={currentQ + 1}
          totalQuestions={quiz.questions.length}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  timerContainer: { alignItems: 'center', justifyContent: 'center' },
  timerText: { position: 'absolute', fontSize: 16, fontWeight: '600' },
  questionArea: { flex: 1, justifyContent: 'center', padding: 24 },
  questionCard: { borderRadius: 24, padding: 32, alignItems: 'center', overflow: 'hidden' },
  resultCard: { flex: 1, justifyContent: 'center', margin: 24, borderRadius: 24, padding: 32, overflow: 'hidden' },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(127,119,221,0.2)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginVertical: 24 },
  btn: { padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 32 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
