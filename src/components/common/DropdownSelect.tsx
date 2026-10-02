/**
 * DropdownSelect Component
 * Elegant, theme-aware custom dropdown selector with integrated search bar.
 *
 * Features:
 * - Search bar with real-time filtering by option label, sublabel, or keywords (e.g. bus registration).
 * - Default selection support (e.g. None / Unassigned).
 * - Clear button and search icon.
 * - Theme-aware light & dark mode support.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput as RNTextInput,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';

export interface DropdownOption<T = string | null> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: string;
  badge?: string;
}

export interface DropdownSelectProps<T = string | null> {
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  style?: ViewStyle;
}

export function DropdownSelect<T = string | null>({
  label,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search bus number or model...',
  searchable = true,
  value,
  options,
  onChange,
  disabled = false,
  error,
  helperText,
  style,
}: DropdownSelectProps<T>) {
  const { colors, isLight } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = options.find((opt) => opt.value === value) || (value === null ? options.find(opt => opt.value === null) : undefined);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter((opt) => {
      const matchLabel = opt.label?.toLowerCase().includes(q);
      const matchSublabel = opt.sublabel?.toLowerCase().includes(q);
      return matchLabel || matchSublabel;
    });
  }, [options, searchQuery]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      setSearchQuery('');
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      ) : null}

      {/* Trigger Box */}
      <TouchableOpacity
        style={[
          styles.trigger,
          {
            backgroundColor: isLight ? '#ffffff' : colors.card,
            borderColor: error
              ? '#ef4444'
              : isOpen
              ? '#00D488'
              : colors.inputBorder,
          },
          disabled && styles.disabled,
        ]}
        onPress={handleToggle}
        activeOpacity={0.75}
      >
        <View style={styles.triggerContent}>
          {selectedOption?.icon ? (
            <Text style={styles.triggerIcon}>{selectedOption.icon}</Text>
          ) : null}
          <Text
            style={[
              styles.triggerText,
              {
                color: selectedOption
                  ? colors.textPrimary
                  : colors.textMuted,
                fontWeight: selectedOption ? '600' : '400',
              },
            ]}
            numberOfLines={1}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
        </View>

        <Text
          style={[
            styles.chevron,
            { color: isOpen ? '#00D488' : colors.textMuted },
          ]}
        >
          {isOpen ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {/* Dropdown Options Menu */}
      {isOpen && (
        <View
          style={[
            styles.dropdownMenu,
            {
              backgroundColor: isLight ? '#ffffff' : '#0f172a',
              borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.12)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isLight ? 0.12 : 0.4,
              shadowRadius: 12,
              elevation: 8,
            },
          ]}
        >
          {/* Integrated Search Bar */}
          {searchable && options.length > 2 && (
            <View
              style={[
                styles.searchBarContainer,
                {
                  borderBottomColor: isLight
                    ? '#f1f5f9'
                    : 'rgba(255, 255, 255, 0.08)',
                  backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                },
              ]}
            >
              <Text style={styles.searchIcon}>🔍</Text>
              <RNTextInput
                placeholder={searchPlaceholder}
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                autoCapitalize="none"
                style={[
                  styles.searchInput,
                  {
                    color: colors.textPrimary,
                  },
                ]}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearSearchBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.clearSearchText, { color: colors.textMuted }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Options List */}
          <ScrollView
            style={styles.optionsList}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, idx) => {
                const isSelected = option.value === value;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.optionItem,
                      {
                        backgroundColor: isSelected
                          ? isLight
                            ? 'rgba(0, 212, 136, 0.12)'
                            : 'rgba(0, 212, 136, 0.18)'
                          : 'transparent',
                        borderBottomColor: isLight
                          ? '#f1f5f9'
                          : 'rgba(255, 255, 255, 0.05)',
                        borderBottomWidth:
                          idx === filteredOptions.length - 1 ? 0 : 1,
                      },
                    ]}
                    onPress={() => handleSelect(option.value)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionLeft}>
                      {option.icon ? (
                        <Text style={styles.optionIcon}>{option.icon}</Text>
                      ) : null}
                      <View style={styles.optionTextContainer}>
                        <Text
                          style={[
                            styles.optionLabel,
                            {
                              color: isSelected
                                ? isLight
                                  ? '#059669'
                                  : '#00D488'
                                : colors.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {option.label}
                        </Text>
                        {option.sublabel ? (
                          <Text
                            style={[
                              styles.optionSublabel,
                              { color: colors.textMuted },
                            ]}
                          >
                            {option.sublabel}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    {isSelected && (
                      <Text
                        style={[
                          styles.checkmark,
                          { color: isLight ? '#059669' : '#00D488' },
                        ]}
                      >
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyResultsBox}>
                <Text style={[styles.emptyResultsText, { color: colors.textMuted }]}>
                  No buses found matching "{searchQuery}"
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: colors.textMuted }]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    position: 'relative',
    zIndex: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    minHeight: 44,
  },
  disabled: {
    opacity: 0.6,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  triggerIcon: {
    fontSize: 16,
  },
  triggerText: {
    fontSize: 14,
  },
  chevron: {
    fontSize: 10,
    marginLeft: 8,
    fontWeight: '900',
  },
  dropdownMenu: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 240,
    overflow: 'hidden',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    gap: 6,
  },
  searchIcon: {
    fontSize: 13,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 12,
    fontWeight: '700',
  },
  optionsList: {
    maxHeight: 180,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  optionIcon: {
    fontSize: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 13,
  },
  optionSublabel: {
    fontSize: 11,
    marginTop: 1,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 8,
  },
  emptyResultsBox: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyResultsText: {
    fontSize: 12,
    textAlign: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 11,
    marginTop: 4,
  },
});
