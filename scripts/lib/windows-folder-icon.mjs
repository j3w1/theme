// Original folder artwork, generated from semantic colors. No Windows asset is
// copied or patched. Multi-size ICO frames keep the native tab/front silhouette.
export function folderIconFile(fill, edge, open=false) {
 const rgb=hex=>hex.slice(1).match(/../g).map(x=>parseInt(x,16));
 const colors=[rgb(edge),rgb(fill)];
 const sizes=[16,20,24,32,40,48,64,96,128,256];
 const images=sizes.map(size=>{
  const stride=Math.ceil(size/32)*4, pixels=Buffer.alloc(size*size*4),mask=Buffer.alloc(stride*size);
  const inside=(x,y,points)=>{
   let result=false;
   for(let i=0,j=points.length-1;i<points.length;j=i++){
    const [a,b]=points[i],[c,d]=points[j];
    if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)result=!result;
   }
   return result;
  };
  const back=[[2,5],[3,4],[11,4],[14,7],[29,7],[30,8],[30,27],[2,27]];
  const front=open?[[5,12],[31,12],[27,28],[1,28]]:[[2,11],[30,11],[30,27],[29,28],[3,28],[2,27]];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const sum=[0,0,0];let covered=0;
   // Small frames need real coverage alpha, not a scaled 32px bitmap.
   for(let sy=0;sy<4;sy++)for(let sx=0;sx<4;sx++){
    const u=(x+(sx+.5)/4)*32/size,v=(y+(sy+.5)/4)*32/size;
    const panel=inside(u,v,front);
    if(!panel&&!inside(u,v,back))continue;
    const color=colors[panel?1:0];covered++;
    for(let c=0;c<3;c++)sum[c]+=color[c];
   }
   const at=((size-1-y)*size+x)*4;
   if(covered){for(let c=0;c<3;c++)pixels[at+2-c]=Math.round(sum[c]/covered);pixels[at+3]=Math.round(covered*255/16);}
   else mask[(size-1-y)*stride+(x>>3)]|=128>>(x%8);
  }
  const dib=Buffer.alloc(40);dib.writeUInt32LE(40);dib.writeInt32LE(size,4);dib.writeInt32LE(size*2,8);dib.writeUInt16LE(1,12);dib.writeUInt16LE(32,14);dib.writeUInt32LE(pixels.length+mask.length,20);
  return Buffer.concat([dib,pixels,mask]);
 });
 const header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);let offset=header.length;
 sizes.forEach((size,i)=>{const n=6+16*i;header[n]=size%256;header[n+1]=size%256;header.writeUInt16LE(1,n+4);header.writeUInt16LE(32,n+6);header.writeUInt32LE(images[i].length,n+8);header.writeUInt32LE(offset,n+12);offset+=images[i].length;});
 return Buffer.concat([header,...images]);
}
