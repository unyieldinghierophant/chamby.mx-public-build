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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 dark:from-blue-950 dark:via-blue-900 dark:to-blue-800 pt-32 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <JobBookingForm />
        </div>
      </div>
    </>
  );
};

export default BookJob;
