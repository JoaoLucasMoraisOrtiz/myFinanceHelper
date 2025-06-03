const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

// Caminho para o diretório de dados
const dataDir = path.join(__dirname, 'data')

// Garantir que o diretório de dados existe
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

let mainWindow

const createWindow = () => {
  // Criar a janela do navegador
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // Não mostrar até estar carregada
    icon: path.join(__dirname, 'assets/icon.png'), // Ícone da aplicação (se existir)
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true // Manter segurança web ativa
    }
  })

  // Carregar o arquivo HTML principal
  mainWindow.loadFile('./src/view/pages/index.html')

  // Mostrar janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    
    // Só abrir DevTools em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools()
    }
  })

  // Tratar tentativas de navegação externa
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Permitir apenas URLs da própria aplicação
    if (url.startsWith('file://') || url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
      return { action: 'allow' }
    }
    
    // Para URLs externos, abrir no navegador padrão
    require('electron').shell.openExternal(url)
    return { action: 'deny' }
  })

  // Event listeners para melhor UX
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Criar janela quando o Electron estiver pronto
app.whenReady().then(() => {
  createWindow()

  // Configurar IPC (Inter-Process Communication)
  configurarIPC()

  app.on('activate', () => {
    // No macOS, é comum recriar uma janela quando
    // o ícone do dock é clicado e não há outras janelas abertas
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Sair quando todas as janelas estiverem fechadas, exceto no macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Configurar comunicação IPC entre processos
function configurarIPC() {
  // Salvar dados financeiros
  ipcMain.handle('salvar-dados', async (event, dados) => {
    try {
      const filePath = path.join(dataDir, 'financas.json')
      fs.writeFileSync(filePath, JSON.stringify(dados, null, 2), 'utf-8')
      return { success: true }
    } catch (error) {
      console.error('Erro ao salvar dados:', error)
      return { success: false, error: error.message }
    }
  })

  // Carregar dados financeiros
  ipcMain.handle('carregar-dados', async () => {
    try {
      const filePath = path.join(dataDir, 'financas.json')
      if (fs.existsSync(filePath)) {
        const dados = fs.readFileSync(filePath, 'utf-8')
        const dadosObj = JSON.parse(dados)
        
        // Garante que todas as propriedades existam
        if (!dadosObj.planejamento) {
          dadosObj.planejamento = { receitas: [], despesas: [] }
        } else {
          if (!dadosObj.planejamento.receitas) dadosObj.planejamento.receitas = []
          if (!dadosObj.planejamento.despesas) dadosObj.planejamento.despesas = []
        }
        
        return { success: true, dados: dadosObj }
      }
      return { 
        success: true, 
        dados: { 
          receitas: [], 
          despesas: [],
          planejamento: {
            receitas: [],
            despesas: []
          }
        } 
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      return { success: false, error: error.message }
    }
  })

  // ========== NOVOS HANDLERS PARA AUTENTICAÇÃO ==========
  
  // Salvar token de autenticação de forma segura
  ipcMain.handle('salvar-auth-token', async (event, token) => {
    try {
      const authFilePath = path.join(dataDir, '.auth')
      fs.writeFileSync(authFilePath, token, 'utf-8')
      return { success: true }
    } catch (error) {
      console.error('Erro ao salvar token:', error)
      return { success: false, error: error.message }
    }
  })

  // Carregar token de autenticação
  ipcMain.handle('carregar-auth-token', async () => {
    try {
      const authFilePath = path.join(dataDir, '.auth')
      if (fs.existsSync(authFilePath)) {
        const token = fs.readFileSync(authFilePath, 'utf-8')
        return { success: true, token }
      }
      return { success: true, token: null }
    } catch (error) {
      console.error('Erro ao carregar token:', error)
      return { success: false, error: error.message }
    }
  })

  // Limpar dados de autenticação
  ipcMain.handle('limpar-auth-data', async () => {
    try {
      const authFilePath = path.join(dataDir, '.auth')
      if (fs.existsSync(authFilePath)) {
        fs.unlinkSync(authFilePath)
      }
      return { success: true }
    } catch (error) {
      console.error('Erro ao limpar dados de auth:', error)
      return { success: false, error: error.message }
    }
  })

  // Fazer requisições HTTP autenticadas
  ipcMain.handle('fazer-requisicao-http', async (event, { url, method = 'GET', headers = {}, body = null }) => {
    try {
      const https = require('https')
      const http = require('http')
      const urlObj = new URL(url)
      const isHttps = urlObj.protocol === 'https:'
      
      return new Promise((resolve, reject) => {
        const options = {
          hostname: urlObj.hostname,
          port: urlObj.port || (isHttps ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'FinanceApp/1.0',
            ...headers
          }
        }

        const req = (isHttps ? https : http).request(options, (res) => {
          let data = ''
          res.on('data', chunk => data += chunk)
          res.on('end', () => {
            try {
              const response = {
                status: res.statusCode,
                headers: res.headers,
                data: data ? JSON.parse(data) : null
              }
              resolve({ success: true, response })
            } catch (parseError) {
              resolve({ 
                success: true, 
                response: { 
                  status: res.statusCode, 
                  headers: res.headers, 
                  data: data 
                } 
              })
            }
          })
        })

        req.on('error', (error) => {
          resolve({ success: false, error: error.message })
        })

        if (body) {
          req.write(typeof body === 'string' ? body : JSON.stringify(body))
        }
        
        req.end()
      })
    } catch (error) {
      console.error('Erro na requisição HTTP:', error)
      return { success: false, error: error.message }
    }
  })

  // Exportar dados para CSV
  ipcMain.handle('exportar-csv', async (event, dados) => {
    try {
      const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Exportar Dados Financeiros',
        defaultPath: path.join(app.getPath('documents'), `financas_${new Date().toISOString().split('T')[0]}.csv`),
        filters: [{ name: 'Arquivos CSV', extensions: ['csv'] }]
      })

      if (filePath) {
        let csvContent = ''
        
        // Seção de Receitas
        csvContent += 'RECEITAS\n'
        csvContent += 'Descrição,Valor,Data,Categoria\n'
        if (dados.receitas && dados.receitas.length > 0) {
          dados.receitas.forEach(receita => {
            const descricao = (receita.descricao || '').replace(/,/g, ';')
            const valor = receita.valor || 0
            const data = receita.data || ''
            const categoria = (receita.categoria || '').replace(/,/g, ';')
            csvContent += `"${descricao}",${valor},"${data}","${categoria}"\n`
          })
        }
        
        csvContent += '\n'
        
        // Seção de Despesas
        csvContent += 'DESPESAS\n'
        csvContent += 'Descrição,Valor,Data,Categoria,Parcelas,Taxa Juros\n'
        if (dados.despesas && dados.despesas.length > 0) {
          dados.despesas.forEach(despesa => {
            const descricao = (despesa.descricao || '').replace(/,/g, ';')
            const valor = despesa.valor || 0
            const data = despesa.data || ''
            const categoria = (despesa.categoria || '').replace(/,/g, ';')
            const parcelas = despesa.parcelas || 1
            const taxaJuros = despesa.taxaJuros || 0
            csvContent += `"${descricao}",${valor},"${data}","${categoria}",${parcelas},${taxaJuros}\n`
          })
        }
        
        csvContent += '\n'
        
        // Seção de Planejamento
        if (dados.planejamento) {
          csvContent += 'PLANEJAMENTO - RECEITAS\n'
          csvContent += 'Descrição,Valor Previsto,Categoria\n'
          if (dados.planejamento.receitas && dados.planejamento.receitas.length > 0) {
            dados.planejamento.receitas.forEach(receita => {
              const descricao = (receita.descricao || '').replace(/,/g, ';')
              const valor = receita.valor || 0
              const categoria = (receita.categoria || '').replace(/,/g, ';')
              csvContent += `"${descricao}",${valor},"${categoria}"\n`
            })
          }
          
          csvContent += '\n'
          
          csvContent += 'PLANEJAMENTO - DESPESAS\n'
          csvContent += 'Descrição,Valor Previsto,Categoria\n'
          if (dados.planejamento.despesas && dados.planejamento.despesas.length > 0) {
            dados.planejamento.despesas.forEach(despesa => {
              const descricao = (despesa.descricao || '').replace(/,/g, ';')
              const valor = despesa.valor || 0
              const categoria = (despesa.categoria || '').replace(/,/g, ';')
              csvContent += `"${descricao}",${valor},"${categoria}"\n`
            })
          }
        }
        
        // Adicionar resumo estatístico
        csvContent += '\n'
        csvContent += 'RESUMO ESTATÍSTICO\n'
        const totalReceitas = dados.receitas ? dados.receitas.reduce((sum, r) => sum + (r.valor || 0), 0) : 0
        const totalDespesas = dados.despesas ? dados.despesas.reduce((sum, d) => sum + (d.valor || 0), 0) : 0
        const saldo = totalReceitas - totalDespesas
        csvContent += `Total de Receitas,${totalReceitas}\n`
        csvContent += `Total de Despesas,${totalDespesas}\n`
        csvContent += `Saldo,${saldo}\n`
        csvContent += `Data de Exportação,"${new Date().toLocaleString('pt-BR')}"\n`
        
        fs.writeFileSync(filePath, csvContent, 'utf-8')
        return { success: true, filePath }
      }
      return { success: false, canceled: true }
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      return { success: false, error: error.message }
    }
  })
  
  // Configurações do usuário
  ipcMain.handle('salvar-configuracoes', async (event, config) => {
    try {
      const filePath = path.join(dataDir, 'config.json')
      fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8')
      return { success: true }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      return { success: false, error: error.message }
    }
  })
  
  ipcMain.handle('carregar-configuracoes', async () => {
    try {
      const filePath = path.join(dataDir, 'config.json')
      if (fs.existsSync(filePath)) {
        const config = fs.readFileSync(filePath, 'utf-8')
        return { success: true, config: JSON.parse(config) }
      }
      return { 
        success: true, 
        config: { 
          tema: 'light',
          moeda: 'BRL',
          notificacoes: true,
          autoBackup: false
        } 
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      return { success: false, error: error.message }
    }
  })
  
  // Backup automático
  ipcMain.handle('criar-backup', async () => {
    try {
      const sourceFile = path.join(dataDir, 'financas.json')
      if (!fs.existsSync(sourceFile)) {
        return { success: false, error: 'Nenhum dado para backup' }
      }
      
      const backupDir = path.join(dataDir, 'backups')
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupFile = path.join(backupDir, `backup_${timestamp}.json`)
      
      fs.copyFileSync(sourceFile, backupFile)
      
      // Manter apenas os últimos 10 backups
      const backups = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
        .sort()
        .reverse()
      
      if (backups.length > 10) {
        backups.slice(10).forEach(file => {
          fs.unlinkSync(path.join(backupDir, file))
        })
      }
      
      return { success: true, backupFile }
    } catch (error) {
      console.error('Erro ao criar backup:', error)
      return { success: false, error: error.message }
    }
  })

  // ========== HANDLERS ADICIONAIS PARA MELHOR UX ==========
  
  // Obter informações da aplicação
  ipcMain.handle('obter-info-app', async () => {
    return {
      success: true,
      info: {
        versao: app.getVersion(),
        nome: app.getName(),
        dataDir: dataDir,
        plataforma: process.platform,
        arquitetura: process.arch,
        versaoElectron: process.versions.electron,
        versaoNode: process.versions.node
      }
    }
  })

  // Abrir diretório de dados
  ipcMain.handle('abrir-diretorio-dados', async () => {
    try {
      const { shell } = require('electron')
      await shell.openPath(dataDir)
      return { success: true }
    } catch (error) {
      console.error('Erro ao abrir diretório:', error)
      return { success: false, error: error.message }
    }
  })

  // Reiniciar aplicação
  ipcMain.handle('reiniciar-app', async () => {
    app.relaunch()
    app.quit()
  })

  // Log de debug (apenas em desenvolvimento)
  ipcMain.handle('log-debug', async (event, nivel, mensagem, dados = null) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] [${nivel.toUpperCase()}] ${mensagem}`, dados || '')
    }
    return { success: true }
  })
}