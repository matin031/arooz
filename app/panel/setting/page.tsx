import AccountSettings from "@/components/UI/AccountSettings";
import ExitPanelBtn from "@/components/UI/ExitPanelBtn";
import EmailVerification from "@/components/UI/panel/EmailVerification";
import ActiveDevices from "@/components/UI/panel/ActiveDevices";

export const dynamic = "force-dynamic";

function Page() {
  return (
    <div className="relative z-20 flex flex-col gap-6">
      <div>
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
          حساب کاربری
        </span>
        <h1 className="text-xl font-bold">تنظیمات حساب</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          نام، رمز عبور، ایمیل و نشست‌های فعال حسابت را مدیریت کن.
        </p>
      </div>
      <EmailVerification />
      <AccountSettings />
      <ActiveDevices />
      <ExitPanelBtn />
    </div>
  );
}

export default Page;
