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
                style={{ width: 44, height: 44, backgroundColor: COLORS.background.card, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border.subtle }}
              >
                <ArrowLeft size={20} color={COLORS.accent.primary} />
              </TouchableOpacity>
            )}
            
            {role && (
              <View style={{ backgroundColor: 'rgba(203,166,247,0.12)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
                <Text style={{ color: COLORS.accent.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  {role}
                </Text>
              </View>
            )}
          </View>

          <View style={{ alignItems: 'center', marginTop: 80, mb: 10 }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: COLORS.text.primary, marginBottom: 8, fontFamily: 'Montserrat' }}>{title}</Text>
            <Text style={{ fontSize: 14, color: COLORS.text.secondary, marginBottom: 32 }}>{subtitle}</Text>
          </View>

          <View style={{ height: 1, backgroundColor: COLORS.border.subtle, marginHorizontal: -24, marginBottom: 32 }} />

          <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%' }}>
            {inputs.map((input, index) => (
              <View key={index} style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 }}>
                  {input.label}
                </Text>
                <TextInput
                  style={{
                    backgroundColor: COLORS.background.input,
                    borderRadius: 14,
                    height: 56,
                    paddingHorizontal: 16,
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

            {error ? <Text style={{ color: COLORS.status.error, textAlign: 'center', marginBottom: 20, fontWeight: '500' }}>{error}</Text> : null}

            <View style={{ marginTop: 12 }}>
              <ButtonColorful title={submitLabel} onPress={onSubmit} loading={loading} style={{ width: '100%' }} />
            </View>
          </Animated.View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 40, marginBottom: 20 }}>
            <Text style={{ color: COLORS.text.secondary }}>{footerText} </Text>
            <TouchableOpacity onPress={onFooterAction}>
              <Text style={{ color: COLORS.accent.primary, fontWeight: '700' }}>{footerActionText}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Courier', fontSize: 10, color: COLORS.border.subtle }}>GATE0 · SECURE ACCESS</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
