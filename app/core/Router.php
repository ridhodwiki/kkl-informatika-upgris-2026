<?php

class Router
{
    private $routes = [];

    public function add($method, $path, $handler)
    {
        $this->routes[] = [strtoupper($method), $this->normalize($path), $handler];
    }

    public function dispatch($method, $path)
    {
        $method = strtoupper($method);
        $path = $this->normalize($path);
        foreach ($this->routes as [$routeMethod, $routePath, $handler]) {
            if ($routeMethod !== $method || $routePath !== $path) continue;
            return [true, call_user_func($handler)];
        }
        return [false, null];
    }

    private function normalize($path)
    {
        $path = '/' . ltrim((string)$path, '/');
        return $path === '/' ? '/' : rtrim($path, '/');
    }
}
