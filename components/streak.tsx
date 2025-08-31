import useUserStore from '@/core/userState';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

interface StreakProps {
  lastSignIn: string; 
}

const DailyCheckInStreak: React.FC<StreakProps> = ({ lastSignIn }) => {
  const { user, theme } = useUserStore();
  const [currentStreak, setCurrentStreak] = useState( user?.streak || 0);
  
  useEffect(() => {
    if (user) {
      checkAndUpdateStreak(lastSignIn);
    }
  }, [user, lastSignIn]);

  const parseLastSignInDate = (lastSignInText?: string): Date => {
    if (!lastSignInText) return new Date();
    
    try {
      return new Date(lastSignInText);
    } catch (error) {
      console.error('Error parsing last sign-in date:', error);
      return new Date();
    }
  };

  const checkAndUpdateStreak = (lastSignInText?: string) => {
    if (!user?.streak) {
      setCurrentStreak(1);
      return;
    }
    const lastActive = parseLastSignInDate(lastSignInText);
    const now = new Date();
    
    const hoursDiff = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      setCurrentStreak(1);
    } else {
      setCurrentStreak(user.streak);
    }
  };

  const getActiveDays = (streak: number) => {
    const todayIndex = new Date().getDay(); 
    const active = [];

    for (let i = 0; i < streak; i++) {
      const index = (todayIndex - i + 7) % 7; 
      active.push(index);
    }

    return active;
  };

  const activeIndexes = getActiveDays(currentStreak);

  return (
    <View style={[styles.container, theme === "dark" && {backgroundColor: '#131313', borderColor: "#2E3033"}]}>
      <Text style={[styles.heading, theme === "dark" && {color: "#E0E0E0"}]}>Daily Check-in Streak</Text>
      <View style={styles.row}>
        {days.map((day, index) => {
          const isActive = activeIndexes.includes(index);
          return (
            <View key={index} style={styles.dayContainer}>
              <Text style={[styles.dayText, theme === "dark" && {color: "#B3B3B3"}]}>{day}</Text>
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: isActive ? '#F0FFF9' : (theme === "dark" ? '#0D0D0D' : '#F9FBFC') },
                  isActive ? styles.activeIconWrapper : {},
                  theme === "dark" && !isActive && {borderColor: "#2E3033"}
                ]}
              >
                {isActive && <FontAwesome5 name="fire" size={18} color="#00FF80" />}
              </View>
            </View>
          );
        })}
      </View>
      <Text style={[styles.streakText, theme === "dark" && {color: "#E0E0E0"}]}>🔥 {currentStreak}-Day Streak</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 0.5,
    borderColor: '#EDF3FC',
    alignItems: 'center',
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Satoshi',
    color: '#2D3C52',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    width: '100%',
  },
  dayContainer: {
    alignItems: 'center',
    flex: 1,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#61728C',
    marginBottom: 8,
    fontFamily: 'Satoshi',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDF3FC',
  },
  activeIconWrapper: {
    borderColor: '#00FF80',
  },
  streakText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3C52',
    fontFamily: 'Satoshi',
  },
});

export default DailyCheckInStreak;
