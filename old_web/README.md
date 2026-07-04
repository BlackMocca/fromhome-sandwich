## Command
### Development
```shell
bun run dev
```
### Production
1. Build standalone nextjs
```shell
bun run build
```
2. bun run start required on folder node_modules .next/standalone, .next/static, 
```shell
bun run start
```

### ENV
```
MONGO_URI="mongodb+srv://user:pass@localhost:27017/fromhome?retryWrites=true&w=majority"
```