import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useReservation } from '../context/ReservationContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const AuthView = () => {
  const { login, register, systemTime, authError, isAuthLoading } = useReservation();
  const { colors } = useTheme();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirmPass, setShowRegConfirmPass] = useState(false);

  // Specific field-level validation errors displayed beside the invalid field
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});
  const [regErrors, setRegErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Email format validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const validateLoginForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    const trimmedEmail = loginEmail.trim().toLowerCase();
    const trimmedPass = loginPass.trim();

    if (!trimmedEmail) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Enter a valid email address';
    }

    if (!trimmedPass) {
      errors.password = 'Password is required';
    } else if (trimmedPass.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegisterForm = (): boolean => {
    const errors: {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    const trimmedName = regName.trim();
    const trimmedEmail = regEmail.trim().toLowerCase();
    const trimmedPhone = regPhone.trim();
    const trimmedPass = regPass.trim();
    const trimmedConfirmPass = regConfirmPass.trim();

    if (!trimmedName) {
      errors.name = 'Full name is required';
    }

    if (!trimmedEmail) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Enter a valid email address';
    }

    if (!trimmedPhone) {
      errors.phone = 'Phone number is required';
    } else {
      // Validate phone has at least 7 digits
      const digits = trimmedPhone.replace(/\D/g, '');
      if (digits.length < 7) {
        errors.phone = 'Enter a valid phone number';
      }
    }

    if (!trimmedPass) {
      errors.password = 'Password is required';
    } else if (trimmedPass.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!trimmedConfirmPass) {
      errors.confirmPassword = 'Password confirmation is required';
    } else if (trimmedPass !== trimmedConfirmPass) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setRegErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    // Strictly validate all required fields before calling Supabase
    const isValid = validateLoginForm();
    if (!isValid) {
      return;
    }

    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPass = loginPass.trim();

    const success = await login(cleanEmail, cleanPass);
    if (!success) {
      setErrorMessage(authError || 'Invalid credentials. Please verify your email and password.');
    }
  };

  const handleRegister = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    // Strictly validate all required fields before calling Supabase
    const isValid = validateRegisterForm();
    if (!isValid) {
      return;
    }

    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanPhone = regPhone.trim();
    const cleanPass = regPass.trim();

    const success = await register(cleanName, cleanEmail, cleanPhone, cleanPass);
    if (success) {
      // Per requirements: switch to sign in tab without redirecting to main menu
      setLoginEmail(cleanEmail);
      setLoginPass('');
      setRegPass('');
      setRegConfirmPass('');
      setRegErrors({});
      setLoginErrors({});
      setTab('login');
      setSuccessMessage('Registration successful! Please sign in with your email and password.');
    } else {
      setErrorMessage(authError || 'Registration failed. Please check your inputs.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.keyboardContainer, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.cardContainer}>
          {/* Header Banner */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={styles.terminalBadge}>
                <Text style={styles.terminalBadgeText}>BUS TERMINAL</Text>
              </View>
              <View style={styles.liveClockBadge}>
                <Text style={styles.liveClockText}>🕒 {systemTime}</Text>
              </View>
            </View>

            <Text style={styles.mainTitle}>Welcome to BusGo</Text>
            <Text style={styles.subtitle}>
              Book trips, monitor live standby & ongoing buses, and track departures in real-time.
            </Text>
          </View>

          {/* Tabs: Sign In / Create Account */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]}
              onPress={() => {
                setTab('login');
                setErrorMessage('');
                setSuccessMessage('');
                setLoginErrors({});
                setRegErrors({});
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  tab === 'login' && styles.tabBtnTextActive,
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, tab === 'register' && styles.tabBtnActive]}
              onPress={() => {
                setTab('register');
                setErrorMessage('');
                setSuccessMessage('');
                setLoginErrors({});
                setRegErrors({});
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  tab === 'register' && styles.tabBtnTextActive,
                ]}
              >
                Register Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Success notification if registration succeeded */}
          {successMessage ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={18} color="#34D399" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          {/* Error notification if any */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#F87171" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form Content */}
          {tab === 'login' ? (
            <View style={styles.formContainer}>
              {/* Login Email */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeaderRow}>
                  <Text style={styles.inputLabel}>EMAIL OR USERNAME</Text>
                  {loginErrors.email ? (
                    <Text style={styles.fieldErrorText}>{loginErrors.email}</Text>
                  ) : null}
                </View>
                <TextInput
                  style={[styles.input, loginErrors.email && styles.inputErrorBorder]}
                  placeholder="e.g. passenger@busgo.com"
                  placeholderTextColor="#64748B"
                  value={loginEmail}
                  onChangeText={(val) => {
                    setLoginEmail(val);
                    if (loginErrors.email) setLoginErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>

              {/* Login Password with White Show/Hide Icon */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeaderRow}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  {loginErrors.password ? (
                    <Text style={styles.fieldErrorText}>{loginErrors.password}</Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.passwordWrapper,
                    loginErrors.password && styles.inputErrorBorder,
                  ]}
                >
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password (min 8 characters)"
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showLoginPass}
                    value={loginPass}
                    onChangeText={(val) => {
                      setLoginPass(val);
                      if (loginErrors.password) {
                        setLoginErrors((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowLoginPass(!showLoginPass)}
                    activeOpacity={0.7}
                    accessibilityLabel={showLoginPass ? 'Hide password' : 'Show password'}
                  >
                    <Ionicons
                      name={showLoginPass ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, isAuthLoading && styles.submitBtnDisabled]}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={isAuthLoading}
              >
                {isAuthLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Sign In to Bus Terminal</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContainer}>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeaderRow}>
                  <Text style={styles.inputLabel}>FULL NAME</Text>
                  {regErrors.name ? (
                    <Text style={styles.fieldErrorText}>{regErrors.name}</Text>
                  ) : null}
                </View>
                <TextInput
                  style={[styles.input, regErrors.name && styles.inputErrorBorder]}
                  placeholder="e.g. Maria Santos"
                  placeholderTextColor="#64748B"
                  value={regName}
                  onChangeText={(val) => {
                    setRegName(val);
                    if (regErrors.name) setRegErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                />
              </View>

              {/* Email Address */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeaderRow}>
                  <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                  {regErrors.email ? (
                    <Text style={styles.fieldErrorText}>{regErrors.email}</Text>
                  ) : null}
                </View>
                <TextInput
                  style={[styles.input, regErrors.email && styles.inputErrorBorder]}
                  placeholder="e.g. maria.santos@gmail.com"
                  placeholderTextColor="#64748B"
                  value={regEmail}
                  onChangeText={(val) => {
                    setRegEmail(val);
                    if (regErrors.email) setRegErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>

              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeaderRow}>
                  <Text style={styles.inputLabel}>PHONE NUMBER (FOR TICKET SMS)</Text>
                  {regErrors.phone ? (
                    <Text style={styles.fieldErrorText}>{regErrors.phone}</Text>
                  ) : null}
                </View>
                <TextInput
                  style={[styles.input, regErrors.phone && styles.inputErrorBorder]}
                  placeholder="+63 9XX XXX XXXX"
                  placeholderTextColor="#64748B"
                  value={regPhone}
                  onChangeText={(val) => {
                    setRegPhone(val);
                    if (regErrors.phone) setRegErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Password with White Show/Hide Icon */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeaderRow}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  {regErrors.password ? (
                    <Text style={styles.fieldErrorText}>{regErrors.password}</Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.passwordWrapper,
                    regErrors.password && styles.inputErrorBorder,
                  ]}
                >
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Create a password (min 8 characters)"
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showRegPass}
                    value={regPass}
                    onChangeText={(val) => {
                      setRegPass(val);
                      if (regErrors.password) {
                        setRegErrors((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowRegPass(!showRegPass)}
                    activeOpacity={0.7}
                    accessibilityLabel={showRegPass ? 'Hide password' : 'Show password'}
                  >
                    <Ionicons
                      name={showRegPass ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password with White Show/Hide Icon */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeaderRow}>
                  <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                  {regErrors.confirmPassword ? (
                    <Text style={styles.fieldErrorText}>{regErrors.confirmPassword}</Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.passwordWrapper,
                    regErrors.confirmPassword && styles.inputErrorBorder,
                  ]}
                >
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Re-enter your password"
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showRegConfirmPass}
                    value={regConfirmPass}
                    onChangeText={(val) => {
                      setRegConfirmPass(val);
                      if (regErrors.confirmPassword) {
                        setRegErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                      }
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowRegConfirmPass(!showRegConfirmPass)}
                    activeOpacity={0.7}
                    accessibilityLabel={showRegConfirmPass ? 'Hide password' : 'Show password'}
                  >
                    <Ionicons
                      name={showRegConfirmPass ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, isAuthLoading && styles.submitBtnDisabled]}
                onPress={handleRegister}
                activeOpacity={0.85}
                disabled={isAuthLoading}
              >
                {isAuthLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Create Account & Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Features Footer */}
          <View style={styles.featuresRow}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🚏</Text>
              <Text style={styles.featureTitle}>Standby Bays</Text>
              <Text style={styles.featureDesc}>Live Departure Gates</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🚌</Text>
              <Text style={styles.featureTitle}>Ongoing Buses</Text>
              <Text style={styles.featureDesc}>Live Highway GPS & ETA</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🏁</Text>
              <Text style={styles.featureTitle}>Just Arrived</Text>
              <Text style={styles.featureDesc}>Turnaround & Re-boarding</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 32,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  terminalBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  terminalBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  liveClockBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  liveClockText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 4,
    marginBottom: 18,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  successBox: {
    backgroundColor: '#064E3B',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  successText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  errorBox: {
    backgroundColor: '#450A0A',
    borderWidth: 1,
    borderColor: '#991B1B',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    flex: 1,
    fontWeight: '600',
  },
  formContainer: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  fieldErrorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FB7185',
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 14,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 14,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputErrorBorder: {
    borderColor: '#EF4444',
  },
  submitBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    flexWrap: 'wrap',
    gap: 10,
  },
  featureItem: {
    flex: 1,
    minWidth: 90,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  featureTitle: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  featureDesc: {
    color: '#64748B',
    fontSize: 10,
    textAlign: 'center',
  },
});
