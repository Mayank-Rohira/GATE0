import React, { useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, Animated, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { ButtonColorful } from './button-colorful';

export function PremiumAuth({
  title,
  subtitle,
  role,
  onBack,
  inputs,
  onSubmit,
  submitLabel,
  loading,
  error,
  footerText,
  footerActionText,
  onFooterAction,
}) {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Provide a ref-based shake method if needed, but since it's managed via props, we can trigger shake internally if error changes
  React.useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
          
          {/* Header Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 24, right: 24, zIndex: 10 }}>
            {onBack && (
              <TouchableOpacity
                onPress={onBack}
                style={{ width: 44, height: 44, backgroundColor: COLORS.background.surface, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowLeft size={20} color={COLORS.accent.primary} />
              </TouchableOpacity>
            )}
            
            {role && (
              <View style={{ backgroundColor: COLORS.background.cardHigh, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border.tactile }}>
                <Text style={{ color: COLORS.accent.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  {role}
                </Text>
              </View>
            )}
          </View>

          <View style={{ alignItems: 'flex-start', marginTop: 100, marginBottom: 10, paddingHorizontal: 4 }}>
            <Text selectable={true} style={{ fontSize: 38, fontWeight: '800', color: COLORS.text.primary, marginBottom: 8, letterSpacing: -2 }}>{title}</Text>
            <Text selectable={true} style={{ fontSize: 13, color: COLORS.text.muted, marginBottom: 40, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: '700' }}>{subtitle}</Text>
          </View>

          <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%' }}>
            {inputs.map((input, index) => (
              <View key={index} style={{ marginBottom: 24 }}>
                <Text selectable={true} style={{ fontSize: 10, fontWeight: '800', color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, marginLeft: 4 }}>
                  {input.label}
                </Text>
                <TextInput
                  style={{
                    backgroundColor: COLORS.background.surface,
                    borderRadius: 8,
                    height: 60,
                    paddingHorizontal: 20,
                    fontSize: 16,
                    color: COLORS.text.primary,
                    borderWidth: 1,
                    borderColor: COLORS.border.subtle,
                  }}
                  placeholderTextColor={COLORS.text.muted}
                  {...input.props}
                />
              </View>
            ))}

            {error ? <Text style={{ color: COLORS.status.error, textAlign: 'left', marginLeft: 4, marginBottom: 24, fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>{error}</Text> : null}

            <View style={{ marginTop: 8 }}>
              <ButtonColorful title={submitLabel} onPress={onSubmit} loading={loading} style={{ width: '100%', height: 60, borderRadius: 8 }} />
            </View>
          </Animated.View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 40, marginBottom: 40 }}>
            <Text selectable={true} style={{ color: COLORS.text.muted, fontSize: 13 }}>{footerText} </Text>
            <TouchableOpacity onPress={onFooterAction}>
              <Text style={{ color: COLORS.accent.primary, fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>{footerActionText}</Text>
            </TouchableOpacity>
          </View>


          <View style={{ position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: COLORS.text.muted, letterSpacing: 3, fontWeight: '600' }}>GATE0 · SECURE ACCESS</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
