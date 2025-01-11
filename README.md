# Practice-ig-clone

## Init Web Project
1. bun using create project from github template or npm template this code is like `npx create-next-app@latest [project-name] [options]`
Read More https://stackoverflow.com/questions/77076841/bun-x-create-next-app-is-stuck-at-the-second-question
```shell
bun create next-app web --ts --tailwind --use-bun --import-alias "@/*"
```
2. Replace "script" on file package.json
```json
{
    "scripts": {
        "dev": "bun next dev",
        "build": "bun next build",
        "start": "bun next start",
        "lint": "bun next lint"
    }
}
```