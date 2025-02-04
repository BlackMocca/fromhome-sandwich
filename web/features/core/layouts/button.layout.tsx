import classNames from 'classnames';

type IButtonLayout = {
    title: string
    isActive: boolean
    onclick: () => void
    size: "sm" | "md" | "lg"
    type?: 'button' | 'submit' | 'reset';
}

export default function ButtonLayout(props: IButtonLayout) {
    const sizing = (s: IButtonLayout['size']) => {
        switch (s) {
          case 'sm':
            return 'h-[34px]';
          case 'md':
            return 'h-[46px]';
          case "lg":
            return 'h-[58px]';
        }
    };
    
  return (
    <button 
        className={classNames("flex w-full justify-center items-center text-xl border-0 rounded-[27px] hover:bg-action hover:color-secondary duration-300",
            sizing(props.size),
            {
                "bg-action color-secondary": props.isActive, 
                "bg-secondary": !props.isActive,
            },
        )}

        onClick={props.onclick}
    >
        {props.title}
    </button>
  );
}
