import axios from 'axios';

export const sendOtpSms = async (phone, otp) => {
  try {
    const apiKey = process.env.TWOFACTOR_API_KEY;
    const templateName = process.env.TWOFACTOR_TEMPLATE_NAME || 'AUTOGEN'; // Default template name
    
    if (!apiKey) {
      throw new Error('2Factor API key is not configured');
    }

    // 2factor.in API endpoint
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phone}/${otp}/${templateName}`;
    
    const response = await axios.get(url);
    
    if (response.data.Status === 'Success') {
      console.log(`OTP sent successfully to ${phone}`);
      return { success: true, message: 'OTP sent successfully' };
    } else {
      console.error('Failed to send OTP:', response.data);
      return { success: false, message: 'Failed to send OTP' };
    }
  } catch (error) {
    console.error('Error sending OTP via SMS:', error.message);
    return { success: false, message: 'Error sending OTP', error: error.message };
  }
};
