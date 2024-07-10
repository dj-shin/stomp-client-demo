'use client'

import styles from "./page.module.css";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";

interface Response {
  response: string
}

interface StompClientParams {
  callback: (r: Response) => void
}

const useStompClient = (p: StompClientParams) => {
  const clientRef: MutableRefObject<Client | null> = useRef(null);
  useEffect(() => {
    const client = new Client({
      brokerURL: 'wss://askyourfhir.maro.io/ws',
      onConnect: () => {
        client.subscribe('/sub/response', message => {
          console.log(`Received: ${message.body}`);
          p.callback(JSON.parse(message.body) as Response);
        });
      },
    });
    client.activate();

    clientRef.current = client;
    return () => {
      clientRef.current?.deactivate();
    }
  }, [p]);
  return clientRef;
};

export default function Home() {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [responseMessage, setResponseMessage] = useState<string|null>(null);
  const clientRef = useStompClient({
    callback: r => setResponseMessage(r.response)
  });
  const submit = () => {
    clientRef.current?.publish({
      destination: '/pub/request',
      body: JSON.stringify({ "query": textRef.current?.value })
    });
  };
  return (
    <main className={styles.main}>
      <textarea ref={textRef}/>
      {responseMessage &&
        <p>{responseMessage}</p>
      }
      <button onClick={() => {submit()}}>Send</button>
    </main>
  );
}
