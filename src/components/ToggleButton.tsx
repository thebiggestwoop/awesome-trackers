import "../index.css";

export default function ToggleButton({
  isChecked,
  changeHandler,
}: {
  isChecked: boolean;
  changeHandler: (isChecked: boolean) => void;
}) {
  const handleCheckboxChange = () => {
    // console.log(!isChecked);
    changeHandler(!isChecked);
  };

  return (
    <>
      <label className="flex cursor-pointer select-none items-center">
        <div className="relative">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={handleCheckboxChange}
            className="peer sr-only"
          />
          <div className="h-[26px] w-[45px] rounded-full bg-black/35 p-1 transition duration-150 peer-checked:bg-[#74649f]"></div>
          <div
            className={
              "absolute left-[4px] top-[4px] size-[18px] rounded-full bg-[#e0e0e0]/80 transition peer-checked:translate-x-[19px] peer-checked:bg-[#ccb3ff]"
            }
          ></div>
        </div>
      </label>
    </>
  );
}
