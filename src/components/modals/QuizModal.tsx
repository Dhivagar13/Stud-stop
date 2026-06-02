import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useThemeStore } from '../../stores/themeStore';
import type { QuizQuestion } from '../../types';

interface QuizModalProps {
  visible: boolean;
  question: QuizQuestion;
  selectedAnswer: number | null;
  isCorrect: boolean | null;
  onSelect: (index: number) => void;
  onNext: () => void;
  questionNumber: number;
  totalQuestions: number;
}

export function QuizModal({
  visible,
  question,
  selectedAnswer,
  isCorrect,
  onSelect,
  onNext,
  questionNumber,
  totalQuestions,
}: QuizModalProps) {
  const theme = useThemeStore((s) => s.theme);
  const slideUp = useSharedValue(visible ? 0 : 400);

  React.useEffect(() => {
    slideUp.value = withSpring(visible ? 0 : 400, { damping: 20, stiffness: 150 });
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideUp.value }],
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView intensity={60} tint="dark" style={styles.overlay}>
        <Animated.View style={[styles.modal, animatedStyle, { backgroundColor: theme.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.counter, { color: theme.textMuted }]}>
              {questionNumber} / {totalQuestions}
            </Text>
          </View>
          <Text style={[styles.question, { color: theme.text }]}>{question.question}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {question.options.map((opt, i) => {
              const isSelected = selectedAnswer === i;
              const isCorrectAnswer = question.correct_answer === i;
              let borderColor = theme.glassBorder;
              if (selectedAnswer !== null) {
                if (isCorrectAnswer) borderColor = theme.success;
                else if (isSelected && !isCorrectAnswer) borderColor = theme.danger;
              }
              if (isSelected) borderColor = theme.accent;

              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.option, { borderColor, backgroundColor: theme.glass }]}
                  onPress={() => onSelect(i)}
                  disabled={selectedAnswer !== null}
                >
                  <Text style={[styles.optionText, { color: theme.text }]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {selectedAnswer !== null && (
            <View style={[styles.feedback, { backgroundColor: isCorrect ? theme.success + '20' : theme.danger + '20' }]}>
              <Text style={{ color: isCorrect ? theme.success : theme.danger, fontWeight: '600' }}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </Text>
              <Text style={{ color: theme.textMuted, marginTop: 4 }}>{question.explanation}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: theme.accent }]}
            onPress={onNext}
            disabled={selectedAnswer === null}
          >
            <Text style={styles.nextText}>
              {questionNumber === totalQuestions ? 'Finish' : 'Next'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  header: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  counter: { fontSize: 14, fontWeight: '500' },
  question: { fontSize: 18, fontWeight: '500', marginBottom: 20, lineHeight: 26 },
  option: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  optionText: { fontSize: 15 },
  feedback: { padding: 12, borderRadius: 12, marginTop: 12 },
  nextBtn: { padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 16 },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
