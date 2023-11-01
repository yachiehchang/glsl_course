// Author:YaJ Chang
// Title:BreathingGlow+noise-practice

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float glow(float d, float str, float thickness){
    return thickness / pow(d, str);
}

vec2 hash2( vec2 x )            //亂數範圍 [-1,1]
{
    const vec2 k = vec2( 0.3183099, 0.3678794 );
    x = x*k + k.yx;
    return -1.0 + 2.0*fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)) );
}
float gnoise( in vec2 p )       //亂數範圍 [-1,1]
{
    vec2 i = floor( p );
    vec2 f = fract( p );
    
    vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( dot( hash2( i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ), 
                            dot( hash2( i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                         mix( dot( hash2( i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ), 
                            dot( hash2( i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}
#define Use_Perlin
//#define Use_Value
float noise( in vec2 p )        //亂數範圍 [-1,1]
{
#ifdef Use_Perlin    
return gnoise(p);   //gradient noise
#elif defined Use_Value
return vnoise(p);       //value noise
#endif    
return 0.0;
}
float fbm(in vec2 uv)       //亂數範圍 [-1,1]
{
    float f;                                                //fbm - fractal noise (4 octaves)
    mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
    f   = 0.5000*noise( uv ); uv = m*uv;          
    f += 0.2500*noise( uv ); uv = m*uv;
    f += 0.1250*noise( uv ); uv = m*uv;
    f += 0.0625*noise( uv ); uv = m*uv;
    return f;
}

//加入形狀的宣告 heart
float M_SQRT_2 = 1.418;
float heart(vec2 P, float size)
{
float x = M_SQRT_2/2.0 * (P.x - P.y);
float y = M_SQRT_2/2.0 * (P.x + P.y);
float r1 = max(abs(x),abs(y))-size/3.5;
float r2 = length(P - M_SQRT_2/2.0*vec2(+1.0,-1.0)*size/3.5)
- size/3.5;
float r3 = length(P - M_SQRT_2/2.0*vec2(-1.0,-1.0)*size/3.5)
- size/3.5;
return min(min(r1,r2),r3);
}

//circle wave
float sdCircleWave( in vec2 p, in float tb, in float ra )
{
    tb = 3.1415927*5.0/6.0*max(tb,0.0001);
    vec2 co = ra*vec2(sin(tb),cos(tb));
    p.x = abs(mod(p.x,co.x*4.0)-co.x*2.0);
    vec2  p1 = p;
    vec2  p2 = vec2(abs(p.x-2.0*co.x),-p.y+2.0*co.y);
    float d1 = ((co.y*p1.x>co.x*p1.y) ? length(p1-co) : abs(length(p1)-ra));
    float d2 = ((co.y*p2.x>co.x*p2.y) ? length(p2-co) : abs(length(p2)-ra));
    return min(d1, d2); 
}


void main() {
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
    uv.x *= u_resolution.x/u_resolution.y;
    uv= uv*2.0-1.0;
    
    float info=fbm(0.66*uv+u_time*vec2(0.1,0.06))*0.55;
    
    //陰晴圓缺
    float pi=3.14159;
    float theta=2.0*pi*u_time/8.0;
    vec2 point=vec2(sin(theta), cos(theta));
    float dir= dot(point, (uv))+0.55;
    
    //亂數作用雲霧
    float fog= fbm(0.4*uv+vec2(-0.1*u_time, -0.02*u_time))*0.6+0.1;

    //定義圓環
    float dist = length(uv);
    //float circle_dist = abs(dist-0.512);                                //光環大小
    
    float result;
    //迴圈 給結果 讓迴圈之外可以吃到宣告
    for(int index=0; index<8; ++index)
    {
    //heart //model-1
    vec2 uv_flip=vec2(uv.x, -uv.y); //利用座標系統將愛心翻正
    float weight=smoothstep(1.012, -0.440, -uv.y); //利用權重去控制 以上以下的範圍 > 加上smoothstep 需要給定義範圍 要再去確認影響範圍值
    float freq=0.400+float(index)*2.86; //index是整數用float包起來可以去乘浮點數
    float noise=gnoise(uv*freq+vec2(-0.1*u_time, -0.02*u_time))*0.022*weight; //(uv_flip*頻率(high frequency))*low amplitude
    float rotation=sin(2.0*u_time/5.448*pi)*0.5+0.2;
    float model_dist = abs(sdCircleWave(uv, 0.265,0.148)*heart(uv_flip,0.696*rotation)+noise);//abs(sdStar(uv, 0.188, 12, 1.092))
    
    //動態呼吸
    float breathing=sin(2.0*u_time/5.0*pi)*0.5+0.2;                     //option1
    float strength =(0.1*breathing+0.560);          //[0.2~0.3]         //光暈強度加上動態時間營造呼吸感
    float thickness=(0.0075);          //[0.1~0.2]         //光環厚度 營造呼吸感
    float glow_circle = glow(model_dist, strength, thickness);  
    result+=glow_circle;
    }
    gl_FragColor = vec4((vec3(result)+fog+info)*dir*vec3(1.000,0.308,0.279)*0.208,1.72);
}