import { JobBookingForm } from "@/components/JobBookingForm";
import Header from "@/components/Header";

const BookJob = () => {
  return (
    <>
      <Header hideLogo hideProfileMenu />
      <div className="min-h-screen bg-background pt-32 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <JobBookingForm />
        </div>
      </div>
    </>
  );
};

export default BookJob;
