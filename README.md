# univer-sheet-collab-demo

基于 Vue 3、TypeScript、Vite 和 Univer 的表格考核与大数据性能 demo。

## 启动

```powershell
cd frontend
npm install
npm run dev
```

另开终端启动后端：

```powershell
cd server-spring
mvn spring-boot:run
```

前端开发地址为 `http://localhost:5174`，后端为 `http://localhost:8081`。

## 验证

```powershell
cd frontend; npm test -- --run; npm run build
cd ..\server-spring; mvn test
```

第一阶段不启用实时协同；`gateway/README.md` 记录后续接入边界。
"# Univer-sheet-demo" 
