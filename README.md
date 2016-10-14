
install ubuntu server

install docker
```sh
sudo apt-get update &&
sudo apt-get install apt-transport-https ca-certificates &&
sudo apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
```
create /etc/apt/sources.list.d/docker.list with the content:
  ubuntu 14:   deb https://apt.dockerproject.org/repo ubuntu-trusty main

```sh
sudo vim /etc/apt/sources.list.d/docker.list
```

```sh

sudo apt-get install -qq linux-image-extra-$(uname -r) linux-image-extra-virtual &&
sudo apt-get update &&
sudo apt-get install -qq docker-engine &&
sudo service docker start

sudo groupadd docker

sudo gpasswd -a ubuntu docker
```

log out, then back in

```sh
docker run hello-world
```

start mongo in docker
```sh
docker pull mongo:latest &&
docker run -v "$(pwd)":/data --name mongo -d mongo mongod --smallfiles
```

install distelli agent
```sh
wget -qO- https://www.distelli.com/download/client | sh
sudo /usr/local/bin/distelli agent install

```