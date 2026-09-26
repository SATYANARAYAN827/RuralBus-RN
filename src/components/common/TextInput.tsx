import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
} from 'react-native';
import { useTheme } from '../../theme';

export interface TextInputProps {
  label?: string;
  sublabel?: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  leftIcon?: string | React.ReactNode;
  rightIcon?: string | React.ReactNode;
  onRightIconPress?: () => void;
  error?: string;
  disabled?: boolean;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: ViewStyle;
  inputStyle?: TextStyle;
  containerStyle?: ViewStyle;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  sublabel,
  required = false,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  error,
  disabled = false,
  keyboardType = 'default',
  maxLength,
  autoCapitalize = 'none',
  style,
  inputStyle,
  containerStyle,
}) => {
  const { colors, isLight, borderRadius, spacing } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const hasPasswordToggle = secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: isLight ? '#334155' : '#cbd5e1' }]}>
            {label}
            {required && <Text style={styles.requiredStar}> *</Text>}
          </Text>
          {sublabel && (
            <Text style={[styles.sublabel, { color: colors.textMuted }]}>{sublabel}</Text>
          )}
        </View>
      )}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error
              ? '#e11d48'
              : isFocused
              ? '#00D488'
              : colors.inputBorder,
            borderRadius: borderRadius.xl,
            opacity: disabled ? 0.6 : 1,
          },
          style,
        ]}
      >
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {typeof leftIcon === 'string' ? (
              <Text style={styles.iconText}>{leftIcon}</Text>
            ) : (
              leftIcon
            )}
          </View>
        )}

        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inputPlaceholder}
          secureTextEntry={hasPasswordToggle ? !isPasswordVisible : false}
          editable={!disabled}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.nativeInput,
            {
              color: colors.inputText,
            },
            inputStyle,
          ]}
        />

        {hasPasswordToggle ? (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIconContainer}
            activeOpacity={0.7}
          >
            <Text style={styles.iconText}>{isPasswordVisible ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.rightIconContainer}
            activeOpacity={0.7}
          >
            {typeof rightIcon === 'string' ? (
              <Text style={styles.iconText}>{rightIcon}</Text>
            ) : (
              rightIcon
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sublabel: {
    fontSize: 11,
  },
  requiredStar: {
    color: '#e11d48',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    minHeight: 48,
    paddingHorizontal: 12,
    
  },
  leftIconContainer: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIconContainer: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  iconText: {
    fontSize: 15,
  },
  nativeInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
    
  },
  errorText: {
    fontSize: 11,
    color: '#e11d48',
    marginTop: 4,
    fontWeight: '600',
  },
});
