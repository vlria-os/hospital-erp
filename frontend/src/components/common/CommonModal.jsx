import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const CommonModal = ({ open, onClose, children, title, contentClass }) => {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className={`max-h-[90vh] overflow-y-auto ${contentClass ?? "max-w-xl sm:max-w-xl"}`}>
        <DialogTitle className={title ? "" : "sr-only"}>
          {title || "Modal"}
        </DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default CommonModal;
