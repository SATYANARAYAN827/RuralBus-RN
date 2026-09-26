import { LanguageCode } from '../types';

export interface AuthTranslations {
  subtitle: string;
  userIdLabel: string;
  userIdPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  rememberMe: string;
  forgotPassword: string;
  signIn: string;
  authenticating: string;
  newCommuter: string;
  createAccount: string;
  quickLogins: string;
  roles: {
    passenger: string;
    driver: string;
    conductor: string;
    owner: string;
    admin: string;
  };
  reg: {
    fullNameLabel: string;
    fullNamePlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    createPasswordLabel: string;
    createPasswordPlaceholder: string;
    sendOtp: string;
    sendingOtp: string;
    alreadyRegistered: string;
    signInLink: string;
    otpSentTo: string;
    smsSentHint: string;
    autofillCode: string;
    enterCode: string;
    editPhone: string;
    resendIn: string;
    resendCode: string;
    verifyAndRegister: string;
    creatingAccount: string;
  };
  recovery: {
    title: string;
    subtitle: string;
    phoneLabel: string;
    phonePlaceholder: string;
    phoneHelp: string;
    sendOtpBtn: string;
    sendingOtp: string;
    codeSentTo: string;
    testOtp: string;
    changePhone: string;
    expiresIn: string;
    verifyCodeBtn: string;
    verifyingOtp: string;
    newPassLabel: string;
    newPassPlaceholder: string;
    confirmPassLabel: string;
    confirmPassPlaceholder: string;
    resetBtn: string;
    resetting: string;
    resetSuccess: string;
  };
  forceChange: {
    title: string;
    subtitle: string;
    currPassLabel: string;
    currPassPlaceholder: string;
    newPassLabel: string;
    newPassPlaceholder: string;
    confirmPassLabel: string;
    confirmPassPlaceholder: string;
    submitBtn: string;
    updating: string;
  };
}

export const AUTH_TRANSLATIONS: Record<LanguageCode, AuthTranslations> = {
  EN: {
    subtitle: 'Rural Bus Transit & Operational Portal',
    userIdLabel: 'Mobile Number / User ID',
    userIdPlaceholder: 'e.g. 9876500001 or email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    rememberMe: 'Remember Me',
    forgotPassword: 'Forgot Password?',
    signIn: 'Sign In to Account',
    authenticating: 'Authenticating…',
    newCommuter: 'New commuter?',
    createAccount: 'Create Passenger Account',
    quickLogins: 'QUICK EVALUATION LOGINS',
    roles: {
      passenger: 'Passenger',
      driver: 'Driver',
      conductor: 'Conductor',
      owner: 'Fleet Owner',
      admin: 'Super Admin',
    },
    reg: {
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'e.g. Rahul Sharma',
      phoneLabel: 'Mobile Number (for SMS OTP)',
      phonePlaceholder: '10-digit mobile number',
      emailLabel: 'Email Address (Optional)',
      emailPlaceholder: 'name@example.com',
      createPasswordLabel: 'Create Password',
      createPasswordPlaceholder: 'At least 6 characters',
      sendOtp: 'Send Verification OTP →',
      sendingOtp: 'Sending SMS OTP…',
      alreadyRegistered: 'Already registered?',
      signInLink: 'Sign In',
      otpSentTo: 'SMS OTP CODE SENT TO',
      smsSentHint: 'Enter the 6-digit verification code sent to your phone via SMS.',
      autofillCode: 'Auto-fill Test Code:',
      enterCode: 'Enter 6-Digit Code',
      editPhone: '← Edit Phone',
      resendIn: 'Resend in',
      resendCode: 'Resend Code',
      verifyAndRegister: 'Verify & Create Account ➔',
      creatingAccount: 'Creating Account…',
    },
    recovery: {
      title: 'Account Recovery',
      subtitle: 'Secure OTP verification flow',
      phoneLabel: 'Registered Mobile Number',
      phonePlaceholder: '10-digit mobile number',
      phoneHelp: 'We will send a 6-digit OTP code valid for 5 minutes.',
      sendOtpBtn: 'Send 6-Digit OTP ➔',
      sendingOtp: 'Sending OTP…',
      codeSentTo: 'Enter 6-digit code sent to:',
      testOtp: 'Test OTP:',
      changePhone: '← Change Phone',
      expiresIn: 'Expires in',
      verifyCodeBtn: 'Verify Code ➔',
      verifyingOtp: 'Verifying OTP…',
      newPassLabel: 'New Password',
      newPassPlaceholder: 'At least 6 characters',
      confirmPassLabel: 'Confirm New Password',
      confirmPassPlaceholder: 'Re-enter new password',
      resetBtn: 'Reset Password ➔',
      resetting: 'Resetting Password…',
      resetSuccess: 'Password reset successfully! You can now log in.',
    },
    forceChange: {
      title: 'Security Setup: Change Password',
      subtitle: 'First-time login requires setting a new secure personal password.',
      currPassLabel: 'Current / Temporary Password',
      currPassPlaceholder: 'Enter current password',
      newPassLabel: 'New Password (min 6 characters)',
      newPassPlaceholder: 'Enter new password',
      confirmPassLabel: 'Confirm New Password',
      confirmPassPlaceholder: 'Re-enter new password',
      submitBtn: 'Update Password & Continue ➔',
      updating: 'Updating Password…',
    },
  },

  OD: {
    subtitle: 'ଓଡ଼ିଶା ଗ୍ରାମୀଣ ବସ୍ ପରିବହନ ଓ ପରିଚାଳନା ପୋର୍ଟାଲ୍',
    userIdLabel: 'ମୋବାଇଲ୍ ନମ୍ବର / ୟୁଜର୍ ଆଇଡି',
    userIdPlaceholder: 'ଯଥା: ୯୮୭୬୫୦୦୦୦୧ କିମ୍ବା ଇମେଲ୍',
    passwordLabel: 'ପାସୱାର୍ଡ',
    passwordPlaceholder: 'ଆପଣଙ୍କ ପାସୱାର୍ଡ ପ୍ରବେଶ କରନ୍ତୁ',
    rememberMe: 'ମନେ ରଖନ୍ତୁ',
    forgotPassword: 'ପାସୱାର୍ଡ ଭୁଲିଗଲେ କି?',
    signIn: 'ଆକାଉଣ୍ଟରେ ଲଗଇନ୍ କରନ୍ତୁ',
    authenticating: 'ପ୍ରମାଣୀକରଣ ଚାଲିଛି…',
    newCommuter: 'ନୂତନ ଯାତ୍ରୀ?',
    createAccount: 'ଯାତ୍ରୀ ଆକାଉଣ୍ଟ ଖୋଲନ୍ତୁ',
    quickLogins: 'ଦ୍ରୁତ ମୂଲ୍ୟାଙ୍କନ ଲଗଇନ୍',
    roles: {
      passenger: 'ଯାତ୍ରୀ',
      driver: 'ଚାଳକ',
      conductor: 'କଣ୍ଡକ୍ଟର',
      owner: 'ବସ୍ ମାଲିକ',
      admin: 'ମୁଖ୍ୟ ପ୍ରଶାସକ',
    },
    reg: {
      fullNameLabel: 'ପୂରା ନାମ',
      fullNamePlaceholder: 'ଯଥା: ରାହୁଲ ଶର୍ମା',
      phoneLabel: 'ମୋବାଇଲ୍ ନମ୍ବର (SMS OTP ପାଇଁ)',
      phonePlaceholder: '୧୦-ଅଙ୍କ ବିଶିଷ୍ଟ ମୋବାଇଲ୍ ନମ୍ବର',
      emailLabel: 'ଇମେଲ୍ ଠିକଣା (ଇଚ୍ଛାଧୀନ)',
      emailPlaceholder: 'name@example.com',
      createPasswordLabel: 'ନୂତନ ପାସୱାର୍ଡ ତିଆରି କରନ୍ତୁ',
      createPasswordPlaceholder: 'ଅତି କମରେ ୬ ଅକ୍ଷର',
      sendOtp: 'ଯାଞ୍ଚ OTP ପଠାନ୍ତୁ →',
      sendingOtp: 'SMS OTP ପଠାଯାଉଛି…',
      alreadyRegistered: 'ପୂର୍ବରୁ ପଞ୍ଜୀକୃତ?',
      signInLink: 'ଲଗଇନ୍ କରନ୍ତୁ',
      otpSentTo: 'SMS OTP କୋଡ୍ ପଠାଯାଇଛି',
      smsSentHint: 'ଆପଣଙ୍କ ଫୋନକୁ SMS ମାଧ୍ୟମରେ ପଠାଯାଇଥିବା ୬-ଅଙ୍କ ବିଶିଷ୍ଟ OTP କୋଡ୍ ପ୍ରବେଶ କରନ୍ତୁ।',
      autofillCode: 'ପରୀକ୍ଷା କୋଡ୍ ସ୍ୱୟଂଚାଳିତ ଭରନ୍ତୁ:',
      enterCode: '୬-ଅଙ୍କ ବିଶିଷ୍ଟ କୋଡ୍ ପ୍ରବେଶ କରନ୍ତୁ',
      editPhone: '← ଫୋନ୍ ନମ୍ବର ବଦଳାନ୍ତୁ',
      resendIn: 'ପୁନଃ ପଠାଇବା',
      resendCode: 'କୋଡ୍ ପୁନଃ ପଠାନ୍ତୁ',
      verifyAndRegister: 'ଯାଞ୍ଚ କରି ଖାତା ଖୋଲନ୍ତୁ ➔',
      creatingAccount: 'ଆକାଉଣ୍ଟ ଖୋଲାଯାଉଛି…',
    },
    recovery: {
      title: 'ଖାତା ପୁନରୁଦ୍ଧାର',
      subtitle: 'ସୁରକ୍ଷିତ OTP ଯାଞ୍ଚ ପ୍ରକ୍ରିୟା',
      phoneLabel: 'ପଞ୍ଜୀକୃତ ମୋବାଇଲ୍ ନମ୍ବର',
      phonePlaceholder: '୧୦-ଅଙ୍କ ବିଶିଷ୍ଟ ମୋବାଇଲ୍ ନମ୍ବର',
      phoneHelp: 'ଆମେ ୫ ମିନିଟ୍ ପାଇଁ ବୈଧ ଏକ ୬-ଅଙ୍କ ବିଶିଷ୍ଟ OTP କୋଡ୍ ପଠାଇବୁ।',
      sendOtpBtn: '୬-ଅଙ୍କ OTP ପଠାନ୍ତୁ ➔',
      sendingOtp: 'OTP ପଠାଯାଉଛି…',
      codeSentTo: 'ପଠାଯାଇଥିବା ୬-ଅଙ୍କ କୋଡ୍ ପ୍ରବେଶ କରନ୍ତୁ:',
      testOtp: 'ପରୀକ୍ଷା OTP:',
      changePhone: '← ଫୋନ୍ ବଦଳାନ୍ତୁ',
      expiresIn: 'ସମାପ୍ତ ହେବ',
      verifyCodeBtn: 'କୋଡ୍ ଯାଞ୍ଚ କରନ୍ତୁ ➔',
      verifyingOtp: 'OTP ଯାଞ୍ଚ ଚାଲିଛି…',
      newPassLabel: 'ନୂତନ ପାସୱାର୍ଡ',
      newPassPlaceholder: 'ଅତି କମରେ ୬ ଅକ୍ଷର',
      confirmPassLabel: 'ପାସୱାର୍ଡ ନିଶ୍ଚିତ କରନ୍ତୁ',
      confirmPassPlaceholder: 'ପାସୱାର୍ଡ ପୁନରାବୃତ୍ତି କରନ୍ତୁ',
      resetBtn: 'ପାସୱାର୍ଡ ରିସେଟ୍ କରନ୍ତୁ ➔',
      resetting: 'ପାସୱାର୍ଡ ରିସେଟ୍ ହେଉଛି…',
      resetSuccess: 'ପାସୱାର୍ଡ ସଫଳତାର ସହ ରିସେଟ୍ ହୋଇଛି! ଆପଣ ଏବେ ଲଗଇନ୍ କରିପାରିବେ।',
    },
    forceChange: {
      title: 'ସୁରକ୍ଷା ସେଟଅପ୍: ପାସୱାର୍ଡ ବଦଳାନ୍ତୁ',
      subtitle: 'ପ୍ରଥମ ଥର ଲଗଇନ୍ ପାଇଁ ଏକ ନୂତନ ସୁରକ୍ଷିତ ପାସୱାର୍ଡ ସେଟ୍ କରିବା ଆବଶ୍ୟକ।',
      currPassLabel: 'ବର୍ତ୍ତମାନର / ଅସ୍ଥାୟୀ ପାସୱାର୍ଡ',
      currPassPlaceholder: 'ବର୍ତ୍ତମାନର ପାସୱାର୍ଡ ପ୍ରବେଶ କରନ୍ତୁ',
      newPassLabel: 'ନୂତନ ପାସୱାର୍ଡ (ଅତି କମରେ ୬ ଅକ୍ଷର)',
      newPassPlaceholder: 'ନୂତନ ପାସୱାର୍ଡ ପ୍ରବେଶ କରନ୍ତୁ',
      confirmPassLabel: 'ନୂତନ ପାସୱାର୍ଡ ନିଶ୍ଚିତ କରନ୍ତୁ',
      confirmPassPlaceholder: 'ପାସୱାର୍ଡ ପୁନରାବୃତ୍ତି କରନ୍ତୁ',
      submitBtn: 'ପାସୱାର୍ଡ ଅପଡେଟ୍ କରି ଆଗକୁ ବଢ଼ନ୍ତୁ ➔',
      updating: 'ଅପଡେଟ୍ ହେଉଛି…',
    },
  },

  HI: {
    subtitle: 'ओडिशा ग्रामीण बस परिवहन एवं परिचालन पोर्टल',
    userIdLabel: 'मोबाइल नंबर / यूज़र आईडी',
    userIdPlaceholder: 'उदा. 9876500001 या ईमेल',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: 'अपना पासवर्ड दर्ज करें',
    rememberMe: 'याद रखें',
    forgotPassword: 'पासवर्ड भूल गए?',
    signIn: 'खाते में साइन इन करें',
    authenticating: 'प्रमाणीकरण जारी है…',
    newCommuter: 'नए यात्री?',
    createAccount: 'यात्री खाता बनाएं',
    quickLogins: 'त्वरित मूल्यांकन लॉगिन',
    roles: {
      passenger: 'यात्री',
      driver: 'चालक',
      conductor: 'कंडक्टर',
      owner: 'फ्लीट मालिक',
      admin: 'सुपर एडमिन',
    },
    reg: {
      fullNameLabel: 'पूरा नाम',
      fullNamePlaceholder: 'उदा. राहुल शर्मा',
      phoneLabel: 'मोबाइल नंबर (SMS OTP हेतु)',
      phonePlaceholder: '10-अंकों का मोबाइल नंबर',
      emailLabel: 'ईमेल पता (वैकल्पिक)',
      emailPlaceholder: 'name@example.com',
      createPasswordLabel: 'नया पासवर्ड बनाएं',
      createPasswordPlaceholder: 'कम से कम 6 अक्षर',
      sendOtp: 'सत्यापन OTP भेजें →',
      sendingOtp: 'SMS OTP भेजा जा रहा है…',
      alreadyRegistered: 'पहले से पंजीकृत?',
      signInLink: 'साइन इन करें',
      otpSentTo: 'SMS OTP कोड भेजा गया है',
      smsSentHint: 'आपके फ़ोन पर SMS द्वारा भेजा गया 6-अंकीय सत्यापन कोड दर्ज करें।',
      autofillCode: 'टेस्ट कोड स्वतः भरें:',
      enterCode: '6-अंकों का कोड दर्ज करें',
      editPhone: '← फ़ोन नंबर बदलें',
      resendIn: 'पुनः भेजने का समय',
      resendCode: 'कोड पुनः भेजें',
      verifyAndRegister: 'सत्यापित कर खाता बनाएं ➔',
      creatingAccount: 'खाता बनाया जा रहा है…',
    },
    recovery: {
      title: 'खाता पुनर्प्राप्ति',
      subtitle: 'सुरक्षित OTP सत्यापन प्रक्रिया',
      phoneLabel: 'पंजीकृत मोबाइल नंबर',
      phonePlaceholder: '10-अंकों का मोबाइल नंबर दर्ज करें',
      phoneHelp: 'हम 5 मिनट के लिए वैध 6-अंकीय OTP कोड भेजेंगे।',
      sendOtpBtn: '6-अंकीय OTP भेजें ➔',
      sendingOtp: 'OTP भेजा जा रहा है…',
      codeSentTo: 'भेजा गया 6-अंकीय कोड दर्ज करें:',
      testOtp: 'टेस्ट OTP:',
      changePhone: '← फ़ोन बदलें',
      expiresIn: 'वैधता शेष',
      verifyCodeBtn: 'कोड सत्यापित करें ➔',
      verifyingOtp: 'OTP सत्यापित हो रहा है…',
      newPassLabel: 'नया पासवर्ड',
      newPassPlaceholder: 'कम से कम 6 अक्षर',
      confirmPassLabel: 'नए पासवर्ड की पुष्टि करें',
      confirmPassPlaceholder: 'पासवर्ड दोबारा दर्ज करें',
      resetBtn: 'पासवर्ड रीसेट करें ➔',
      resetting: 'पासवर्ड रीसेट हो रहा है…',
      resetSuccess: 'पासवर्ड सफलतापूर्वक रीसेट हो गया! अब आप नए पासवर्ड से लॉगिन कर सकते हैं।',
    },
    forceChange: {
      title: 'सुरक्षा सेटअप: पासवर्ड बदलें',
      subtitle: 'पहले लॉगिन के लिए नया सुरक्षित व्यक्तिगत पासवर्ड सेट करना आवश्यक है।',
      currPassLabel: 'वर्तमान / अस्थायी पासवर्ड',
      currPassPlaceholder: 'वर्तमान पासवर्ड दर्ज करें',
      newPassLabel: 'नया पासवर्ड (कम से कम 6 अक्षर)',
      newPassPlaceholder: 'नया पासवर्ड दर्ज करें',
      confirmPassLabel: 'नए पासवर्ड की पुष्टि करें',
      confirmPassPlaceholder: 'पासवर्ड दोबारा दर्ज करें',
      submitBtn: 'पासवर्ड अपडेट कर जारी रखें ➔',
      updating: 'अपडेट हो रहा है…',
    },
  },
};
