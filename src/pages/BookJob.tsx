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
      <div className="min-h-screen bg-background pt-32 pb-12 px-4 md:px-8">
        <JobBookingForm />
      </div>
    </>
  );
};

export default BookJob;
