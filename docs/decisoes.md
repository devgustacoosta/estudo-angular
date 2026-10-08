# Versões e decisões

## Fontes oficiais consultadas

Consulta realizada em 8 de outubro de 2026, antes de selecionar as dependências:

- [Matriz Angular de Node/TypeScript/RxJS](https://angular.dev/reference/versions): Angular 21.2 aceita Node ^24.0.0, TypeScript >=5.9 <6 e RxJS ^7.4.
- [Suporte e releases do Angular](https://angular.dev/reference/releases): linha 21 em suporte LTS. Há uma linha 22 mais recente, mas não é necessária para estes objetivos.
- [Guia oficial Native Federation v3 para Angular](https://native-federation.com/docs/v3/angular-adapter/getting-started/): adapter 21.x para Angular 21.x, bootstrap separado e builder esbuild.
- [Configuração de compartilhamento](https://native-federation.com/docs/v3/core/sharing/).
- [Angular standalone e imports](https://angular.dev/guide/components/importing), [DI](https://angular.dev/guide/di), [lifecycle](https://angular.dev/guide/components/lifecycle), [HTTP testing](https://angular.dev/guide/http/testing).

As versões exatas instaladas constam no `package-lock.json` e em `docs/verificacao.md`. O projeto usa Angular 21.2, Native Federation **21.2.6**, TypeScript 5.9 e RxJS 7.8. O CLI gera APIs standalone e teste Vitest estável. `npm ci` instala as versões do lockfile; evite substituir por “latest” sem revalidar ambos os builds e E2E.

## Federation e contratos

O shell controla bootstrap, autenticação, HttpClient/interceptors, layout, catálogo e administração. O remote expõe `./Routes`, um objeto que exporta `ORDER_ROUTES`. O shell só conhece o nome público e o contrato `Routes`, sem importar o código do checkout diretamente.

`portal-contracts` exporta DTOs, API_URL, SessionStore e CartStore. `portal-ui` exporta controles visuais. Os aliases TypeScript e `sharedMappings` fazem as duas aplicações usarem a mesma identidade das classes/tokens. `providedIn: 'root'` resolve essas classes no injector do shell; as rotas do remote não redeclaram os stores. Os dados de pedidos permanecem na API e o estado do formulário permanece no checkout.

`singleton: true` seleciona uma versão compartilhada no import map. Isso sozinho não garante uma instância de serviço: dois providers em injectors filhos poderiam criar duas instâncias mesmo com a mesma classe. São necessárias a identidade compartilhada da classe e a resolução pelo mesmo escopo de DI. O teste de navegador compara o UUID do CartStore resolvido no layout e checkout e observa o contador zerar após a finalização.

`strictVersion: true` e `requiredVersion: 'auto'` aplicam compatibilidade semver aos pacotes npm compartilhados. Os aliases locais em `sharedMappings` não têm versão npm: Native Federation gera `singleton: true`, versão vazia e `strictVersion: false`. Por isso shell e remote são entregues neste workspace com contrato alinhado. Uma evolução independente exigiria pacote versionado, política de compatibilidade e testes de contrato. Não confunda esse comportamento com validação automática de versões do contrato local.

Os pacotes usados somente no servidor (express/cors), runtime Node, APIs de animação e Signal Forms não utilizadas estão no `skip`. O restante dos pacotes browser usa `shareAll`; não se compartilha todo código de features. O custo de federation é o build adicional, os artefatos compartilhados e o carregamento de import maps antes do bootstrap. O total inicial do CLI não inclui todos os pacotes compartilhados externos e não é uma medida completa do download.

O fallback captura falha de importação das rotas e mantém o shell. Se um componente lazy falhar depois que as rotas já tiverem carregado, essa captura não engloba todas as possíveis falhas posteriores; consulte as limitações de verificação.

## Outras escolhas

| Escolha                      | Benefício                                                | Custo/alternativa                                                                                    |
| ---------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Caso de uso com Promise      | Domínio/aplicação sem RxJS/Angular; adapter substituível | HTTP convertido com firstValueFrom; cancelamento do Observable não cancela automaticamente a Promise |
| API em memória               | Sem instalação de banco, determinística ao reiniciar     | Perde dados; uma única instância Node; em produção usar transação em banco                           |
| Signals para carrinho        | Leitura síncrona e computed simples                      | Sem persistência automática; API readonly não congela profundamente objetos                          |
| BehaviorSubject para filtros | Stream atual e composição RxJS com cancelamento          | Requer gerenciamento de subscriptions                                                                |
| OnPush e listas por ID       | Atualizações previsíveis, reutilização de DOM            | Atualizações precisam preservar a disciplina de imutabilidade                                        |
| Formulário reativo clássico  | Validators e CVA estáveis e consolidados                 | Mais código de controle do que formulário básico                                                     |
| Guards funcionais            | Composição enxuta com inject e UrlTree                   | Não substituem autorização no servidor                                                               |
| Root stores                  | Compartilha entre componentes distantes                  | Persistem enquanto a aplicação existir e precisam ser limpos no logout                               |

## Segurança da demonstração

A API aceita apenas usuários fictícios e emite tokens opacos com expiração de 60 segundos e refresh de uma hora, rotacionado. Não há JWT, cookie HttpOnly, armazenamento persistente, hash de senha, rate limiting, revogação completa ou TLS. Os tokens estão em memória; não há localStorage. O endpoint de falhas exige admin, mas é deliberadamente um recurso de laboratório.

Authorization é anexado somente para origem e caminho-base autorizados. Strings de terceiros e prefixos como `/api-maliciosa` não recebem token. Respostas 403 preservam a sessão. Interpolação Angular mantém dados como texto, sem `innerHTML`, bypass de sanitização ou execução de HTML da API. A API ignora preços recebidos do cliente, valida quantidades/dados e verifica perfil/proprietário. CORS não é mecanismo de autenticação.

A operação de estoque agrega linhas repetidas, valida tudo e então atualiza sem `await` nesse trecho. No único processo Node local, duas requisições são serializadas nesse trecho síncrono. Isso não constitui transação distribuída nem protege múltiplos processos. O teste API envia pedidos concorrentes e verifica que só um é aceito.

## Angular moderno versus NgModules

Imports standalone dizem ao compilador quais componentes, pipes e diretivas o template pode usar. Em aplicações com NgModules, `declarations` e `imports/exports` do módulo davam esse contexto. DI continua uma responsabilidade diferente: providers criam ou escolhem objetos pelo injector. `bootstrapApplication` e `provideHttpClient/provideRouter` substituem a composição pelo AppModule, sem remover a hierarquia de injectors.

O projeto usa `@if/@for`, `input/output` nas APIs novas, `@Input` em um exemplo de ngOnChanges, Signals, inject, DestroyRef, lazy routes e Angular 21 zoneless por padrão. Ainda é possível encontrar `*ngIf/*ngFor`, construtores com DI, NgModules, class guards/interceptors e Zone.js em aplicações antigas. Não trate essas abordagens como necessariamente incorretas; saiba reconhecer a versão e as decisões do projeto.

## Execução no Codespaces

O browser usa a origem do shell: API_URL é `/api`, e o manifesto usa `/remote/remoteEntry.json`. O dev server encaminha API e artefatos remotos para as portas internas 3000 e 4201. Isso permite manter somente 4200 encaminhada e privada, evita HTTP em uma página HTTPS e não exige configurar CORS para cada codespace. O shell escuta em 0.0.0.0 e permite hosts sob `.app.github.dev`. Em produção, configure reverse proxy equivalente; Angular proxyConfig só existe no ng serve.

Referências: [proxy do Angular CLI](https://angular.dev/tools/cli/serve) e [encaminhamento de portas do GitHub Codespaces](https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace).
