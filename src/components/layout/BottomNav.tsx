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
  const { isLight, colors } = useTheme();

  return (
    <View
      style={[
        styles.navBar,
        {
          backgroundColor: isLight ? '#ffffff' : '#0f172a',
          borderTopColor: isLight ? '#e2e8f0' : '#1e293b',
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
                backgroundColor: isActive
                  ? isLight
                    ? '#ecfdf5'
                    : 'rgba(0, 212, 136, 0.12)'
                  : 'transparent',
                borderColor: isActive
                  ? isLight
                    ? '#059669'
                    : roleBadgeColor
                  : 'transparent',
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
                    ? '#475569'
                    : '#cbd5e1',
                  fontWeight: isActive ? '800' : '600',
                },
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
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
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginHorizontal: 2,
    gap: 3,
  },
  iconText: {
    fontSize: 18,
    lineHeight: 20,
  },
  labelText: {
    fontSize: 11,
    letterSpacing: -0.1,
  },
});
