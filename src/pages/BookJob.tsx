import { JobBookingForm } from "@/components/JobBookingForm";
import Header from "@/components/Header";

const BookJob = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-32 pb-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <JobBookingForm />
        </div>
      </div>
    </>
  );
};

export default BookJob;
