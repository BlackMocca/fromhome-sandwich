import classNames from 'classnames';

type IButtonLayout = {
    title: string
    isActive: boolean
    onclick: () => void
    size: "sm" | "md" | "lg"
    type?: 'button' | 'submit' | 'reset';
    style?: string
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
        className={classNames("flex justify-center items-center text-xl border-0 rounded-[27px] hover:bg-action hover:color-secondary duration-300 p-4",
            sizing(props.size),
            {
                "bg-action text-secondary": props.isActive, 
                "bg-secondary text-primary": !props.isActive,
            },
            props.style ? props.style : "w-full"
        )}

        onClick={props.onclick}
    >
        {props.title}
    </button>
  );
}
