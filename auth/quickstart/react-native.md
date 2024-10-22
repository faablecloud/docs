# Quickstart React Native: Login Social con Google

En esta guía vamosa realizar la implementación del servicio de autenticación Faable Auth en React Native. El Identity Provider nos habilita con una única configuración el poder realizar login usando Google, Facebook/Meta, Github, Shopify, Slack, entre otros.

> ⚠️ Antes de empezar:
>
> - Comprueba que tienes instalado el simulador según la plataforma que estés desarrollando, iOS o Android.
> - Utiliza tu editor de código favorito, en este caso utilizaremos en VS Code.

## 🚀 Iniciar el proyecto

Abrimos una nueva terminal para crear un nuevo proyecto.

```bash
npx create-expo-app --template
```

Seguimos estos pasos para completar la instalación.

1. Elegir “Blank (TypeScript)”.
2. Agregar nombre de la aplicación.
3. Esperar que finalice la instalación.

```js
$ npx create-expo-app --template
Need to install the following packages:
create-expo-app@2.3.1
Ok to proceed? (y) y
✔ Choose a template: › Blank (TypeScript)
✔ What is your app named? … faable-login-expo
✔ Downloaded and extracted project files.

> npm install


added 1243 packages, and audited 1244 packages in 30s

✅ Your project is ready!

To run your project, navigate to the directory and run one of the following npm commands.

- cd faable-login-expo
- npm run android
- npm run ios
- npm run web
```

Al acabar la instalación ejecutamos el proyecto para comprobar que todo funciona correctamente.

En Android:

```bash
npm run android
```

En iOS:

```bash
npm run ios
```

Así queda la estructura de carpetas que acabamos de crear.

```txt
📁faable-login-expo
└── .gitignore
└── app.json
└── App.tsx
└── 📁assets
└── adaptive-icon.png
└── favicon.png
└── icon.png
└── splash.png
└── babel.config.js
└── package-lock.json
└── package.json
└── tsconfig.json
```

## 🧩 Botón de Login

Creamos un nuevo archivo donde metemos el componente, lo llamamos LoginButton.tsx y escribimos su código.

```tsx
export const LoginButton = () => {
  return (
    <TouchableOpacity onPress={() => null}>
      <Text>Login</Text>
    </TouchableOpacity>
  );
};
```

Modificamos el archivo App.tsx donde agregaremos un componente LoginButton, que será el que pulsará el usuario para iniciar sesión.

```tsx
export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <LoginButton />
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}
```

## ⚙️ Configuración de Faable Auth

Creamos una carpeta auth y dentro creamos un archivo faableauth.ts donde escribiremos toda la configuración necesaria.

Instalamos los paquetes necesarios para configurar **Faable Auth**.

```bash
npm i @faable/auth-js @faable/auth-helpers-react expo-auth-session react-native-url-polyfill @react-native-async-storage/async-storage
```

Dentro del fichero `faableauth.ts`, definimos las constantes requeridas para las operaciones de inicio y cierre de sesión.

```tsx
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@faable/auth-js";
import { makeRedirectUri } from "expo-auth-session";
import _ as WebBrowser from "expo-web-browser";
import _ as QueryParams from "expo-auth-session/build/QueryParams";

// Constantes
WebBrowser.maybeCompleteAuthSession(); // Required for web only
const redirectTo = makeRedirectUri(); // Redirection URI
```

> ⚠️ ADVERTENCIA: importar la librería de react-native-url-polyfill/auto es necesaria para que @faable/auth-js funcione correctamente.

Creamos una instancia del cliente que se compartirá en toda la aplicación y colocaremos las credenciales de configuración para Faable Auth.

```tsx
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@faable/auth-js";

// Configuración del singleton
const faableAuthUrl = "https://<account_id>.auth.faable.link";
const clientId = "<xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx>";

export const faableAuth = createClient({
  domain: faableAuthUrl,
  clientId,
  storage: AsyncStorage,
});
```

> ✅ Usa las credenciales que encontrarás en el dashboard. Faable Auth está en fase beta por lo que deberás solicitar el acceso uniéndote a nuestro Discord.

Desarrollamos las funciones acorde a las necesidades del proyecto, en este caso serán: obtener una sesión, iniciar sesión y cerrar sesión.

```js
// Obtener la sesión con sus tokens
const createSessionFromUrl = async (url: string) => {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) throw new Error(errorCode);

  const { access_token, refresh_token } = params;

  if (!access_token) return;

  const { data, error } = await faableAuth.setSession({
    access_token,
    refresh_token,
  });

  if (error) throw error;

  return data.session;
};

// Función de login
const login = async () => {
  try {
    const { data, error } = await faableAuth.signInWithOauthConnection({
      redirectTo,
      skipBrowserRedirect: true,
      connection: "connection_xxxxxxxxxxxxxxxxxxxxxx",
      queryParams: {
        prompt: "login",
      },
    });

    if (error) throw error;

    const res = await WebBrowser.openAuthSessionAsync(
      data?.url ?? "",
      redirectTo
    );

    if (res.type === "success") {
      const { url } = res;
      await createSessionFromUrl(url);
    }
  } catch (e) {
    console.error(e);
  }
};

// Función de logout
const logout = async () => {
  await faableAuth.signOut();
};
```

> ⚠️ **IMPORTANTE**: Debes definir que conexión social vas a usar para hacer login. Encontrarás los id de conexión en el dashboard. Los id de conexión tienen este formato: connection_xxxxxxxxxxxxxxxxxxxxxx

Definimos un contexto global para toda la aplicación en el archivo principal del proyecto App.tsx. Configuramos el contexto pasando como prop la instancia de faableauth que hemos configurado previamente.

```tsx
export default function App() {
  return (
    <SessionContextProvider faableauthClient={faableauth}>
      <SafeAreaView style={styles.container}>
        <LoginButton />
        <StatusBar style="light" />
      </SafeAreaView>
    </SessionContextProvider>
  );
}
```

## 👤 Perfil del Usuario

Volvemos al archivo LoginButton.tsx para colocar la lógica necesaria que nos permita mostrar la información del usuario cuando este haya completado el flujo de login. Para ello usaremos el hook useSession() que nos permite acceder a los datos de la sesión y del usuario.

```tsx
import { Image } from "expo-image";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { login, logout } from "../../lib/auth/faableauth";
import { useSession } from "@faable/auth-helpers-react";

export const LoginButton = () => {
  const session = useSession();

  return (
    <>
      {!session && (
        <TouchableOpacity onPress={() => login()} style={styles.login_button}>
          <Text style={styles.text}>Login</Text>
        </TouchableOpacity>
      )}
      {session && (
        <View style={styles.container}>
          <View style={styles.profile_card}>
            <Image
              source={session.user.picture}
              contentFit="cover"
              style={styles.profile_image}
            />
            <Text style={styles.text_user_name}>{session.user.name}</Text>
          </View>
          <TouchableOpacity
            onPress={() => logout()}
            style={styles.logout_button}
          >
            <Text style={styles.text}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};
```

## Referencia

Te dejamos por aquí todo el código del ejemplo en un repositorio, para que lo clones.

- [Repositorio Código Ejemplo](https://github.com/faablecloud/faableauth-examples/tree/main/react-native-expo)
