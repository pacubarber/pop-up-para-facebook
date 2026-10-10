import os, json, base64, sys, concurrent.futures as cf, urllib.request
OUT=sys.argv[1]
KEY=os.environ["OPENAI_API_KEY"]
R="3D render, isolated single object, centered, soft studio lighting, high detail, no text, no letters, transparent background"
jobs={
 "v1_stopwatch":"Glossy red 3D stopwatch, chrome buttons, minimal premium style. "+R,
 "v1_statue":"Classical white marble Greek statue bust of a young man looking down at a smartphone he holds in his hand, entire sculpture tinted in vivid crimson red monochrome, photorealistic, isolated, transparent background, no text",
 "v1_bookmark":"Glossy red 3D bookmark ribbon icon, like a social media save icon, smooth plastic material. "+R,
 "v1_megaphone":"Glossy red 3D megaphone, slightly tilted, minimal premium style. "+R,
 "v2_head":"Half human half robot head in profile, the face is a realistic human woman and the back of the skull is transparent revealing mechanical parts and glowing circuits, black and white grayscale photography style, isolated, transparent background, no text",
 "v2_faceid":"Matte silver chrome 3D smartphone with face recognition scan frame brackets floating in front of it, grayscale clay and chrome style. "+R,
 "v2_popcorn":"Matte grey and silver 3D popcorn bucket with a small play button symbol, grayscale clay chrome style. "+R,
 "v2_card":"Matte silver 3D credit card with a chrome shield and lock in front, grayscale clay chrome style. "+R,
 "v2_pin":"Matte grey 3D map location pin standing on a folded paper map, grayscale clay chrome style. "+R,
}
def gen(name,prompt):
    p=f"{OUT}/{name}.png"
    if os.path.exists(p): return name,"cached"
    body=json.dumps({"model":"gpt-image-1","prompt":prompt,"size":"1024x1024","background":"transparent","quality":"high","n":1}).encode()
    req=urllib.request.Request("https://api.openai.com/v1/images/generations",data=body,headers={"Authorization":"Bearer "+KEY,"Content-Type":"application/json"})
    try:
        r=json.load(urllib.request.urlopen(req,timeout=300))
        open(p,"wb").write(base64.b64decode(r["data"][0]["b64_json"])); return name,"ok"
    except urllib.error.HTTPError as e: return name,"ERR "+e.read().decode()[:300]
with cf.ThreadPoolExecutor(9) as ex:
    for n,s in ex.map(lambda kv: gen(*kv), jobs.items()): print(n,s,flush=True)
