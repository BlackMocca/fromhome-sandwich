import classNames from "classnames";

type IButtonLayout = {
  title: string;
  onclick: (e?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  size: "sm" | "md" | "lg";
  isActive: boolean;
  buttonStyleType: "primary" | "secondary" | "success" | "error" | "disable";
  type?: "button" | "submit" | "reset";
  style?: string;
  disabled?: boolean;
};

export default function ButtonLayout(props: IButtonLayout) {
  const sizing = (s: IButtonLayout["size"]) => {
    switch (s) {
      case "sm":
        return "h-[34px]";
      case "md":
        return "h-[46px]";
      case "lg":
        return "h-[58px]";
    }
  };

  return (
    <button
      className={classNames(
        "flex justify-center items-center text-xl border-0 rounded-[27px] hover:bg-action hover:text-secondary duration-300 p-4",
        sizing(props.size),
        { "bg-primary text-secondary": props.buttonStyleType === "primary" },
        { "bg-secondary text-primary": props.buttonStyleType === "secondary" },
        { "bg-success text-secondary": props.buttonStyleType === "success" },
        { "bg-error text-secondary": props.buttonStyleType === "error" },
        {
          "bg-slate-300 text-secondary pointer-events-none":
            props.buttonStyleType === "disable",
        },
        {
          "!bg-action !text-secondary": props.isActive,
        },
        { hidden: props.disabled },
        props.style ? props.style : "w-full"
      )}
      onClick={props.onclick}
      onTouchStart={() => {props.onclick}}
    >
      {props.title}
    </button>
  );
}
