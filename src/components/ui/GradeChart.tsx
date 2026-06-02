import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';
import { typography } from '../../lib/theme';

interface GradeChartProps {
  data: { semester: number; gpa: number }[];
}

export function GradeChart({ data }: GradeChartProps) {
  const theme = useThemeStore((s) => s.theme);
  const maxGpa = 10;
  const chartHeight = 120;
  const barWidth = 30;

  return (
    <View style={styles.container}>
      <Text style={[typography.h3, { color: theme.text, marginBottom: 12 }]}>Grade Trend</Text>
      <View style={styles.chart}>
        {data.map((point, i) => {
          const height = (point.gpa / maxGpa) * chartHeight;
          return (
            <View key={i} style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    height,
                    width: barWidth,
                    backgroundColor: theme.accent,
                    opacity: 0.6 + (i / data.length) * 0.4,
                  },
                ]}
              />
              <Text style={[styles.label, { color: theme.textMuted }]}>
                S{point.semester}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 140,
  },
  barContainer: { alignItems: 'center', gap: 4 },
  bar: { borderRadius: 8, minHeight: 4 },
  label: { fontSize: 10 },
});
