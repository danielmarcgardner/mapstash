import SignUpForm from '../components/SignUpForm';
import MapStashLogo from "../assets/mapstash_logo.png";

    const SignUpPage = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="flex flex-col items-center">
                <img
                    src={MapStashLogo}
                    alt="MapStash Logo"
                />
                <SignUpForm />
            </div>
        </div>
    );
}; 
export default SignUpPage;