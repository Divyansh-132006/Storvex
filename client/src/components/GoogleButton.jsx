import { GoogleLogin } from "@react-oauth/google";

export default function GoogleButton({ onSuccess, onError }) {
  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => onSuccess(credentialResponse.credential)}
      onError={onError}
      width="320"
    />
  );
}
