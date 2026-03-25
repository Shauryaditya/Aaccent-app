import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ProgressBar as PaperProgressBar } from 'react-native-paper';
import { formatPercentage } from '../../utils/format';

interface ProgressBarProps {
  progress: number; // 0-100
  showLabel?: boolean;
  color?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = true,
  color = '#6366f1',
}) => {
  const normalizedProgress = Math.min(Math.max(progress, 0), 100) / 100;

  return (
    <View style={styles.container}>
      <PaperProgressBar
        progress={normalizedProgress}
        color={color}
        style={styles.progressBar}
      />
      {showLabel && (
        <Text variant="bodySmall" style={styles.label}>
          {formatPercentage(progress)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  label: {
    marginTop: 4,
    textAlign: 'right',
    color: '#666',
  },
});

export default ProgressBar;