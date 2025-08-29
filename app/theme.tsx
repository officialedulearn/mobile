import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import BackButton from '@/components/backButton'
import { Image } from 'expo-image'
import useUserStore from '@/core/userState'

type Props = {}

const theme = (props: Props) => {
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('light')
  const {setTheme} = useUserStore()
  const changeTheme = (theme: "dark" | "light") => {
    setSelectedTheme(theme)
    setTheme(theme)
  }

  return (
    <View style={styles.container}> 
        <View style={styles.topNav}>
            <BackButton />
            <Text style={styles.title}>Theme</Text>
        </View>

        <View style={styles.themes}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                selectedTheme === 'light' ? styles.selectedOption : {},
              ]}
              onPress={() => changeTheme(selectedTheme)}
            >
              <Image source={require("@/assets/images/icons/sun.png")} style={styles.themeIcon} />
              <Text style={[
                styles.themeText,
                selectedTheme === 'light' ? styles.selectedThemeText : {},
              ]}>Light Mode</Text>
              <View
                style={[
                  styles.radioButton,
                  selectedTheme === 'light' ? styles.radioButtonSelected : {},
                ]}
              >
                {selectedTheme === 'light' && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                selectedTheme === 'dark' ? styles.selectedOption : {},
              ]}
              onPress={() => changeTheme('dark')}
            >
              <Image source={require("@/assets/images/icons/moon.png")} style={styles.themeIcon} />
              <Text style={[
                styles.themeText,
                selectedTheme === 'dark' ? styles.selectedThemeText : {},
              ]}>Dark Mode</Text>
              <View
                style={[
                  styles.radioButton,
                  selectedTheme === 'dark' ? styles.radioButtonSelected : {},
                ]}
              >
                {selectedTheme === 'dark' && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>
        </View>
    </View>
  )
}

export default theme

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F9FBFC',
        flex: 1,
        marginTop: 50,
        paddingHorizontal: 24
    },
    topNav: {
        flexDirection: "row",
        gap: 16,
        alignItems: "center",
    },
    title: {
        fontFamily: "Satoshi",
        color: "#2D3C52",
        fontWeight: "500",
        fontSize: 20,
        lineHeight: 24,
    },
    themes: {
        gap: 16,
        flexDirection: "column",
        marginTop: 32,
    },
    themeOption: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#EDF3FC",
    },
    selectedOption: {
        
    },
    radioButton: {
        height: 24,
        width: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#61728C",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    radioButtonSelected: {
        borderColor: "#00FF80",
    },
    radioButtonInner: {
        height: 12,
        width: 12,
        borderRadius: 6,
        backgroundColor: "#00FF80",
    },
    themeIcon: {
        width: 24,
        height: 24,
        marginRight: 12,
    },
    themeText: {
        color: "#2D3C52",
        fontFamily: "Satoshi",
        fontSize: 16,
        fontWeight: "400",
        flex: 1,
    },
    selectedThemeText: {
        fontWeight: "500",
    },
})