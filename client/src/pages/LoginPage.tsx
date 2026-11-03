import LoginForm from "../components/LoginForm";
import MapStashLogo from "../assets/mapstash_logo.png";

const LoginPage = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="flex flex-col items-center">
                <img
                    src={MapStashLogo}
                    alt="MapStash Logo"
                />
                <LoginForm />
            </div>
        </div>
    );
};

export default LoginPage;