import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const RegisterButton = ({ type = "button", onClick, children = "등록" }) => {
  return (
    <Button type={type} onClick={onClick} className="cursor-pointer gap-1.5">
      <Plus size={15} />
      {children}
    </Button>
  );
};

export default RegisterButton;
