import { JobBookingForm } from "@/components/JobBookingForm";
import Header from "@/components/Header";

const BookJob = () => {
  return (
    <>
      <Header 
        hideLogo 
        hideProfileMenu 
        backButtonVariant="close"
        backButtonPosition="right"
      />
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/20 to-primary/30 pt-32 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <JobBookingForm />
        </div>
      </div>
    </>
  );
};

export default BookJob;
