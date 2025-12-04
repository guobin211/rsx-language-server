---
use rsx::{Request, Response};

struct User {
    first_name: String,
    last_name: String,
}

trait Json {
    fn get_name() -> String
}

impl Json for User {
    fn get_name(self) -> String {
        format!("{} {}", self.first_name, self.last_name)
    }
}

async fn get_server_props(req: Request) -> Response {
    Response::json!({
        "title": "this is server props",
        "url": req.url,
    })
}
---

<script>
    import { defineProps } from 'rsx';
    // ssr components
    import Meta from '../components/meta.rsx';
    // csr components
    import App from '../client/react.app.tsx';
    const { title } = defineProps({});

    export default {
        components: [Meta, App]
    }
</script>

<template>
    <head>
        <Meta></Meta>
        <title>客户端渲染</title>
        <meta charset="UTF-8">
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
    </head>
    <body>
        <div id="app">
            <App client="react"></App>
        </div>
    </body>
</template>

<style>
    #app {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
    }
</style>
