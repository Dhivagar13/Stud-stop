import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Svg, { Circle, Defs, Pattern as SvgPattern, Path, Rect, Line } from 'react-native-svg';
import { useThemeStore } from '../../stores/themeStore';

type PatternType = 'dots' | 'waves' | 'mesh' | 'crosshatch' | 'concentric';

interface PatternBackgroundProps {
  style?: StyleProp<ViewStyle>;
  pattern?: PatternType;
  opacity?: number;
  color?: string;
}

const PATTERN_SIZE = 60;
const DOT_RADIUS = 1.5;

function DotsPattern({ color }: { color: string }) {
  return (
    <Defs>
      <SvgPattern id="dots" x="0" y="0" width={PATTERN_SIZE} height={PATTERN_SIZE} patternUnits="userSpaceOnUse">
        <Circle cx={PATTERN_SIZE / 2} cy={PATTERN_SIZE / 2} r={DOT_RADIUS} fill={color} />
        <Circle cx="0" cy="0" r={DOT_RADIUS} fill={color} />
        <Circle cx={PATTERN_SIZE} cy="0" r={DOT_RADIUS} fill={color} />
        <Circle cx="0" cy={PATTERN_SIZE} r={DOT_RADIUS} fill={color} />
        <Circle cx={PATTERN_SIZE} cy={PATTERN_SIZE} r={DOT_RADIUS} fill={color} />
      </SvgPattern>
    </Defs>
  );
}

function WavesPattern({ color }: { color: string }) {
  return (
    <Defs>
      <SvgPattern id="waves" x="0" y="0" width="80" height="40" patternUnits="userSpaceOnUse">
        <Path
          d="M0 20 Q20 0, 40 20 Q60 40, 80 20"
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeLinecap="round"
        />
      </SvgPattern>
    </Defs>
  );
}

function MeshPattern({ color }: { color: string }) {
  return (
    <Defs>
      <SvgPattern id="mesh" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <Line x1="0" y1="0" x2="40" y2="40" stroke={color} strokeWidth="0.5" />
        <Line x1="40" y1="0" x2="0" y2="40" stroke={color} strokeWidth="0.5" />
        <Rect x="0" y="0" width="40" height="40" fill="none" stroke={color} strokeWidth="0.5" />
      </SvgPattern>
    </Defs>
  );
}

function CrosshatchPattern({ color }: { color: string }) {
  return (
    <Defs>
      <SvgPattern id="crosshatch" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <Line x1="0" y1="0" x2="20" y2="20" stroke={color} strokeWidth="0.5" />
        <Line x1="20" y1="0" x2="0" y2="20" stroke={color} strokeWidth="0.5" />
      </SvgPattern>
    </Defs>
  );
}

function ConcentricPattern({ color }: { color: string }) {
  return (
    <Defs>
      <SvgPattern id="concentric" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
        <Circle cx="40" cy="40" r="30" fill="none" stroke={color} strokeWidth="0.5" />
        <Circle cx="40" cy="40" r="20" fill="none" stroke={color} strokeWidth="0.5" />
        <Circle cx="40" cy="40" r="10" fill="none" stroke={color} strokeWidth="0.5" />
      </SvgPattern>
    </Defs>
  );
}

const PATTERN_MAP: Record<PatternType, (c: string) => React.ReactNode> = {
  dots: (c) => <DotsPattern color={c} />,
  waves: (c) => <WavesPattern color={c} />,
  mesh: (c) => <MeshPattern color={c} />,
  crosshatch: (c) => <CrosshatchPattern color={c} />,
  concentric: (c) => <ConcentricPattern color={c} />,
};

const PATTERN_ID_MAP: Record<PatternType, string> = {
  dots: 'dots',
  waves: 'waves',
  mesh: 'mesh',
  crosshatch: 'crosshatch',
  concentric: 'concentric',
};

function PatternBackground({
  style,
  pattern = 'dots',
  opacity = 0.5,
  color: explicitColor,
}: PatternBackgroundProps) {
  const theme = useThemeStore((s) => s.theme);
  const color = explicitColor || theme.patternColor;

  const patternElement = useMemo(() => PATTERN_MAP[pattern](color), [pattern, color]);

  return (
    <View style={[StyleSheet.absoluteFill, style, { opacity }]} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        {patternElement}
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${PATTERN_ID_MAP[pattern]})`} />
      </Svg>
    </View>
  );
}

export default PatternBackground;
