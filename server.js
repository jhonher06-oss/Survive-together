const http=require("http"),fs=require("fs"),path=require("path");
const WebSocket=require("ws");
const PORT=process.env.PORT||8080, players=new Map(); let nextId=1;
const server=http.createServer((req,res)=>{
  const f=path.join(__dirname,"public",req.url==="/"?"index.html":req.url.slice(1));
  if(!f.startsWith(path.join(__dirname,"public"))) return res.writeHead(403).end();
  fs.readFile(f,(e,d)=>e?res.writeHead(404).end():res.end(d));
});
const wss=new WebSocket.Server({server});
const list=()=>[...players.values()].map(p=>({id:p.id,name:p.name,x:p.x,y:p.y}));
const send=o=>{const s=JSON.stringify(o);for(const p of players.values())if(p.ws.readyState===1)p.ws.send(s)};
wss.on("connection",ws=>{
 const p={id:String(nextId++),name:"Player",x:500,y:500,ws}; players.set(p.id,p);
 ws.send(JSON.stringify({type:"welcome",id:p.id,players:list()})); send({type:"players",players:list()});
 ws.on("message",b=>{let m;try{m=JSON.parse(b)}catch{return}
   if(m.type==="join"){p.name=String(m.name||"Player").slice(0,16);send({type:"players",players:list()})}
   if(m.type==="move"){p.x=Math.max(30,Math.min(970,Number(m.x)||p.x));p.y=Math.max(30,Math.min(970,Number(m.y)||p.y));send({type:"move",id:p.id,x:p.x,y:p.y})}
 });
 ws.on("close",()=>{players.delete(p.id);send({type:"players",players:list()})});
});
server.listen(PORT,()=>console.log("Running on port "+PORT));
