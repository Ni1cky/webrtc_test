import asyncio
from websockets.server import serve

async def echo(socket):
    async for message in socket:
        print(message)
        await socket.send(message)

async def main():
    async with serve(echo, "localhost", 5000):
        await asyncio.Future()  # run forever

asyncio.run(main())
