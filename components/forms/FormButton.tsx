import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, TouchableOpacityProps } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface FormButtonProps extends TouchableOpacityProps {
  label: string;
  isLoading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const FormButton: React.FC<FormButtonProps> = ({ 
  label, 
  isLoading = false, 
  icon, 
  variant = 'primary', 
  disabled, 
  style, 
  ...props 
}) => {
  
  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'primary':
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        getContainerStyle(),
        isDisabled && styles.disabledContainer,
        style
      ]}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.bgDark : Colors.primary} />
      ) : (
        <View style={styles.content}>
          {icon && (
            <Ionicons 
              name={icon} 
              size={20} 
              color={variant === 'primary' ? Colors.textPrimary : Colors.primary} 
              style={styles.icon} 
            />
          )}
          <Text style={[styles.text, getTextStyle(), isDisabled && styles.disabledText]}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 52,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryContainer: {
    backgroundColor: Colors.primary,
  },
  secondaryContainer: {
    backgroundColor: Colors.bgSurface,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  disabledContainer: {
    opacity: 0.6,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  text: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  primaryText: {
    color: '#000000', // Assuming primary color works with black text, adjust if needed based on theme
  },
  secondaryText: {
    color: Colors.textPrimary,
  },
  outlineText: {
    color: Colors.primary,
  },
  disabledText: {
    // Keep original color but container opacity handles the disabled look
  },
});
