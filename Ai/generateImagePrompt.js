const axios = require("axios");

const generateImage = async (typeImagePrompt) => {
  try {
    const enhancedPrompt = `
Generate a professional news article banner image for: ${typeImagePrompt}

STYLE & COMPOSITION:
- Cinematic editorial photography style
- Modern news magazine cover aesthetic
- Professional broadcast news graphics
- Dramatic depth of field with compelling focal point
- Clean, modern layout with visual hierarchy
- High-contrast professional color grading
- Studio-quality lighting with strategic shadows
- 3:1 landscape aspect ratio

VISUAL ELEMENTS:
- Bold, impactful imagery
- Contemporary design sensibility
- Sophisticated color palette
- Professional typography-ready composition
- Corporate editorial aesthetic
- High production value
- Sharp, crystal clear detail
- Rich, saturated colors

MOOD & TONE:
- Authoritative and credible
- Modern and contemporary
- Professional journalism aesthetic
- Engaging and attention-grabbing
- Trustworthy editorial feeling

TECHNICAL REQUIREMENTS:
- 4K resolution quality
- Extreme sharpness and clarity
- Realistic lighting and shadows
- Proper white balance
- Balanced composition
- No visible text or logos
- Print-ready quality

NEGATIVE (DO NOT INCLUDE):
- stock photo watermarks
- blurry or out of focus elements
- distorted or deformed faces
- low quality or pixelated
- cartoon or animated style
- text overlays or captions
- amateur photography
- unfocused backgrounds
- oversaturated colors
- cheap or generic appearance
- poverty or suffering
- graphic violence or distress
- offensive content
`;

    const response = await axios({
      url: "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "image/png",
      },
      data: {
        inputs: enhancedPrompt,
      },
      responseType: "arraybuffer",
    });

    return response.data;
  } catch (error) {
    console.error("Image Generation Error:");
    console.error("Status:", error.response?.status);
    console.error("Message:", error.response?.statusText || error.message);
    console.error("Response:", error.response?.data?.toString());
    return null;
  }
};

module.exports = generateImage;
