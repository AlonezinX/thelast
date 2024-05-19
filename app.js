const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());

const port = 8080;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

let listaPersonagens = [];
let listaVolumes = [];

function salvarJSON() {
fs.writeFileSync("./personagens.json", JSON.stringify(listaPersonagens));
}

function salvarJSON2() {
fs.writeFileSync("./volumes.json", JSON.stringify(listaVolumes));
}


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/caminhos/login.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/caminhos/login.html');
});


app.get('/home', (req, res) => {
    if (req.cookies && req.cookies.usuarioLogado === 'true') {
        res.sendFile(__dirname + '/index.html');
    } else {
        res.redirect('/login');
    }
});

app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/caminhos/loginAdm.html');
});

app.get('/admin2', (req, res) => {
    res.sendFile(__dirname + '/caminhos/admin.html');
});


app.get('/personagem', (req, res) => {
    res.sendFile(__dirname + '/caminhos/editar-personagem.html');
});

app.get('/edit', (req, res) => {
    res.sendFile(__dirname + '/caminhos/editPersonagem.html');
});

app.get('/edit2', (req, res) => {
    res.sendFile(__dirname + '/caminhos/Editar.html');
});

app.get('/adicionar-volume', (req, res) => {
    res.sendFile(__dirname + '/caminhos/adicionar-volume.html');
});

app.get('/EditarPersonagem', (req, res) => {
    res.sendFile(__dirname + '/caminhos/editingPerson.html');
});

app.get('/users', (req, res) => {
    // Ler o arquivo JSON de usuários
    fs.readFile('./users.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo JSON:', err);
            return res.status(500).send('Erro ao ler o arquivo JSON');
        }

        try {
            const users = JSON.parse(data);
            res.json(users);
        } catch (error) {
            console.error('Erro ao fazer o parsing do JSON:', error);
            res.status(500).send('Erro ao fazer o parsing do JSON');
        }
    });
});

app.get("/signup", (req, res) => {
    const newUser = {
        username: req.query.username,
        password: req.query.password,
        creationDate: req.query.creationDate,
        creationTime: req.query.creationTime,
    };

    let users = [];
    try {
        const data = fs.readFileSync("./users.json", "utf8");
        users = JSON.parse(data);
    } catch (err) {
        console.error("Erro ao ler o arquivo JSON:", err);
    }

    users.push(newUser);
    fs.writeFileSync("./users.json", JSON.stringify(users));
    
    res.cookie('usuarioLogado', 'true', { maxAge: 900000, httpOnly: true });
    
    res.redirect('/home');
    
    res.send("Cadastro bem-sucedido!");
});

app.get('/listar-personagens', (req, res) => {
    const volumeNumero = req.query.volume; // Obtém o número do volume da URL

    fs.readFile('./volumes.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo volumes.json:', err);
            res.status(500).json({ error: 'Erro ao carregar os volumes.' });
            return;
        }

        const volumes = JSON.parse(data);
        let personagens = [];

        // Verifica se há um volume com o número fornecido
        const volume = volumes.find(vol => vol.numero === volumeNumero);
        if (volume) {
            // Se o volume existe, retorna os personagens desse volume
            personagens = volume.elenco || [];
        }

        res.json(personagens);
    });
});

app.get('/list-characters/:volumeNumber', (req, res) => {
    const volumeNumber = req.params.volumeNumber;

    fs.readFile('./volumes.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo volumes.json:', err);
            res.status(500).json({ error: 'Erro ao carregar os volumes.' });
            return;
        }

        const volumes = JSON.parse(data);
        const volume = volumes.find(volume => volume.numero === volumeNumber);

        if (!volume) {
            res.status(404).json({ error: 'Volume não encontrado.' });
            return;
        }

        const characters = volume.elenco.map(character => ({ nome: character.nome }));
        res.json(characters);
    });
});


app.delete('/delete-volume/:volumeNumber', (req, res) => {
    const volumeNumber = req.params.volumeNumber;

    fs.readFile('./volumes.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo volumes.json:', err);
            res.status(500).json({ error: 'Erro ao carregar os volumes.' });
            return;
        }

        let volumes = JSON.parse(data);
        const index = volumes.findIndex(volume => volume.numero === volumeNumber);

        if (index === -1) {
            res.status(404).json({ error: 'Volume não encontrado.' });
            return;
        }

        volumes.splice(index, 1);

        fs.writeFile('./volumes.json', JSON.stringify(volumes, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('Erro ao escrever no arquivo volumes.json:', err);
                res.status(500).json({ error: 'Erro ao deletar o volume.' });
                return;
            }
            res.json({ message: `Volume ${volumeNumber} deletado com sucesso.` });
        });
    });
});


// Função para ler os volumes do arquivo JSON
function lerVolumes() {
    try {
        const data = fs.readFileSync('./volumes.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erro ao ler o arquivo volumes.json:', error);
        return [];
    }
}

// Função para salvar os volumes no arquivo JSON
function salvarVolumes(volumes) {
    fs.writeFileSync('./volumes.json', JSON.stringify(volumes, null, 4));
}

app.get('/salvar-volume', (req, res) => {
    const novoVolume = {
        titulo: req.query.titulo,
        imagem: req.query.imagem,
        numero: req.query.numero,
        elenco: []
    };

    let volumes = lerVolumes();
    volumes.push(novoVolume);
    salvarVolumes(volumes);
    res.send('Novo volume salvo com sucesso!');
});

app.get('/listar-volumes', (req, res) => {
    const volumes = lerVolumes();
    res.json(volumes);
});



app.get('/salvar-edicao', (req, res) => {
    const volumeNumero = req.query.volumeNumero;
    const nomeAntigo = req.query.nomeAntigo;
    const novoNome = req.query.novoNome;
    const novaDescricao = req.query.novaDescricao;
    const novaImagem = req.query.novaImagem;

    // Lógica para encontrar e atualizar o personagem no volume correspondente na JSON volumes.json
    fs.readFile('./volumes.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo volumes.json:', err);
            return res.status(500).send('Erro interno do servidor');
        }

        let volumes = JSON.parse(data);
        let volume = volumes.find(volume => volume.numero === volumeNumero);
        if (!volume) {
            return res.status(404).send('Volume não encontrado');
        }

        let personagem = volume.elenco.find(personagem => personagem.nome === nomeAntigo);
        if (!personagem) {
            return res.status(404).send('Personagem não encontrado');
        }

        // Atualizar as informações do personagem
        personagem.nome = novoNome;
        personagem.descricao = novaDescricao;
        personagem.imagem = novaImagem;

        // Salvar as alterações no arquivo volumes.json
        fs.writeFile('./volumes.json', JSON.stringify(volumes), err => {
            if (err) {
                console.error('Erro ao salvar as alterações:', err);
                return res.status(500).send('Erro interno do servidor');
            }
            res.send('Personagem atualizado com sucesso!');
        });
    });
});

app.delete('/delete-character/:volumeNumber/:characterName', (req, res) => {
    const volumeNumber = req.params.volumeNumber;
    const characterName = req.params.characterName;

    fs.readFile('./volumes.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo volumes.json:', err);
            res.status(500).json({ error: 'Erro ao carregar os volumes.' });
            return;
        }

        let volumes = JSON.parse(data);
        const volume = volumes.find(volume => volume.numero === volumeNumber);

        if (!volume) {
            res.status(404).json({ error: 'Volume não encontrado.' });
            return;
        }

        const index = volume.elenco.findIndex(character => character.nome === characterName);

        if (index === -1) {
            res.status(404).json({ error: 'Personagem não encontrado.' });
            return;
        }

        volume.elenco.splice(index, 1);

        fs.writeFile('./volumes.json', JSON.stringify(volumes, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('Erro ao escrever no arquivo volumes.json:', err);
                res.status(500).json({ error: 'Erro ao deletar o personagem.' });
                return;
            }
            res.json({ message: `Personagem "${characterName}" deletado do Volume ${volumeNumber} com sucesso.` });
        });
    });
});




app.get('/adicionar-personagem', (req, res) => {
    const nome = req.query.nome;
    console.log("nome:", nome)
    const descricao = req.query.descricao;
    const imagem = req.query.imagem;
    const numeroVolume = req.query.numero;
    console.log("numeroVolume", numeroVolume)

    // Ler o arquivo volumes.json
    fs.readFile('./volumes.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo volumes.json:', err);
            return res.status(500).send('Erro interno do servidor');
        }

        // Converter o conteúdo do arquivo para objeto JavaScript
        const volumes = JSON.parse(data);
        console.log(volumes)

        // Encontrar o volume correspondente ao número recebido
        const volumeee = volumes.find(volu => volu.numero === numeroVolume);
        console.log(volumeee)

        if (!volumeee) {
            return res.status(400).send('Volume não encontrado');
        }

        // Adicionar o novo personagem à array elenco do volume correspondente
        volumeee.elenco.push({ nome, descricao, imagem });

        // Atualizar o arquivo volumes.json com o volume modificado
        fs.writeFile('./volumes.json', JSON.stringify(volumes, null, 2), err => {
            if (err) {
                console.error('Erro ao salvar o arquivo volumes.json:', err);
                return res.status(500).send('Erro interno do servidor');
            }
            console.log('Personagem adicionado com sucesso ao volume:', numeroVolume);
            res.redirect('/admin');
        });
    });
});


app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
