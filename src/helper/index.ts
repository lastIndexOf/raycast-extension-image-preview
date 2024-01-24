import axios from "axios";

export const checkImageByUrl = async (url: string) => {
  console.info(url);
  try {
    const res = await axios.head(url);
    const type = res.headers["content-type"]?.toString();

    return type.startsWith("image/") || type.startsWith("binary/");
  } catch (err) {
    return false;
  }
};
