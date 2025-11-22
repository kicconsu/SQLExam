import { useNavigate } from "react-router-dom";


export default function ButtonRedirect({ to, label, className }) {
    const navigate = useNavigate();
    const handleClick = () => {
        navigate(to);
    }
    return (
        <button type="button" onClick={handleClick} class={className}>
            {label}
        </button>
         


);
}