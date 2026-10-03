import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';
import { NavItem } from '../../types';

export interface BottomNavProps {
  items: NavItem[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  roleBadgeColor?: string;
  style?: ViewStyle;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  items,
  activeTab,
  onSelectTab,
  roleBadgeColor = '#00D488',
  style,
}) => {
  const { isLight, isAgro, colors } = useTheme();

  return (
    <View
      style={[
        styles.navBar,
        {
          backgroundColor: colors.bottomNavBg,
          borderTopColor: colors.bottomNavBorder,
        },
        style,
      ]}
    >
      {items.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onSelectTab(item.id)}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: isActive }}
            activeOpacity={0.7}
            style={[
              styles.tabButton,
              {
                backgroundColor: 'transparent',
              },
            ]}
          >
            <Text style={styles.iconText}>{item.icon}</Text>
            <Text
              style={[
                styles.labelText,
                {
                  color: isActive
                    ? isLight
                      ? '#047857'
                      : roleBadgeColor
                    : isLight
                    ? '#64748b'
                    : '#94a3b8',
                  fontWeight: isActive ? '800' : '600',
                },
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
            {isActive && (
              <View
                style={[
                  styles.activeIndicator,
                  { backgroundColor: isLight ? '#047857' : roleBadgeColor },
                ]}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    height: 60,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    zIndex: 100,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 4,
    paddingHorizontal: 4,
    gap: 3,
    position: 'relative',
  },
  iconText: {
    fontSize: 18,
    lineHeight: 20,
  },
  labelText: {
    fontSize: 11,
    letterSpacing: -0.1,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 20,
    height: 3,
    borderRadius: 2,
  },
});
